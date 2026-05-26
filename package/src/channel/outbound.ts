// Package
import { RunService, Players } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Codec
import Writer from "../serial/writer";
import Stats from "../debug/stats";

// Channel
import { reliable } from "./wire";

// Scheduler
import { pendingQueue, pendingBroadcasts, flushPending } from "../scheduler/queue";
import { startHeartbeat, startClientHeartbeat } from "../scheduler/heartbeat";

// Definitions
import { getStats } from "../definition/registry";

// Internal
import Logger from "../debug/logger";

const IS_SERVER = RunService.IsServer();
const READY_BYTE = 0;

type Encoder = (writer: Writer) => void;

const readyPlayers = new Set<Player>();
const reliableChannels = new Map<Player, Writer>();
const unreliableChannels = new Map<Player, Writer>();

const reliableChannel = new Writer(512);
const unreliableChannel = new Writer(512);

const pendingClientFlushes: Array<{ name: string; fn: (stats: Stats | undefined) => void }> = [];

function getChannel(player: Player, isUnreliable: boolean): Writer {
    const map = isUnreliable ? unreliableChannels : reliableChannels;
    let ch = map.get(player);
    if (!ch) {
        ch = new Writer(512);
        map.set(player, ch);
    }
    return ch;
}

function handleTarget(
    name: string,
    encode: Encoder,
    isUnreliable: boolean,
    target?: Types.SendTarget,
    onFlush?: (stats: Stats | undefined) => void,
) {
    if (!target) {
        write(name, "All", encode, isUnreliable, onFlush);
    } else if (typeIs(target, "Instance") && target.IsA("Player")) {
        write(name, target, encode, isUnreliable, onFlush);
    } else if (typeIs(target, "table") && !("Except" in (target as object))) {
        for (const player of target as Player[]) {
            write(name, player, encode, isUnreliable, onFlush);
        }
    } else {
        const [, excluded] = target as ["Except", Player | Player[]];
        const excludedSet = new Set<Player>(
            typeIs(excluded, "Instance") ? [excluded] : (excluded as Player[]),
        );
        for (const player of Players.GetPlayers()) {
            if (!excludedSet.has(player)) {
                write(name, player, encode, isUnreliable, onFlush);
            }
        }
    }
}

export function send<T>(
    id: number,
    name: string,
    codec: Types.InternalCodec<T> | undefined,
    isUnreliable: boolean,
    tracker?: Stats,
    dataOrTarget?: T | Types.SendTarget,
    target?: Types.SendTarget,
    onFlush?: (stats: Stats | undefined) => void,
) {
    const encode = (writer: Writer) => {
        const before = writer.cursor;
        writer.u8(id);
        const afterId = writer.cursor;
        if (codec) codec.encode(writer, dataOrTarget as T);
        const after = writer.cursor;

        if (tracker) tracker.trackSend(after - afterId, afterId - before);
    };

    if (IS_SERVER) {
        handleTarget(
            name,
            encode,
            isUnreliable,
            codec ? target : (dataOrTarget as Types.SendTarget),
            onFlush,
        );
    } else {
        write(name, encode, undefined, isUnreliable, onFlush);
    }
}

export function write(
    name: string,
    player: Player | "All" | Encoder,
    encode?: Encoder | boolean,
    isUnreliable?: boolean,
    onFlush?: (stats: Stats | undefined) => void,
) {
    if (IS_SERVER) {
        const p = player as Player | "All";
        const enc = encode as Encoder;
        const unrel = isUnreliable as boolean;

        if (p === "All") {
            if (readyPlayers.size() === 0) {
                pendingBroadcasts.push({ encode: enc, unreliable: unrel, name, onFlush });
            } else {
                for (const rp of readyPlayers) {
                    enc(getChannel(rp, unrel));
                }
                if (onFlush) onFlush(getStats(name));
            }
        } else {
            if (readyPlayers.has(p)) {
                enc(getChannel(p, unrel));
                if (onFlush) onFlush(getStats(name));
            } else {
                pendingQueue.push({ player: p, encode: enc, unreliable: unrel, name, onFlush });
            }
        }
    } else {
        const enc = player as Encoder;
        const unrel = encode as boolean;
        enc(unrel ? unreliableChannel : reliableChannel);
        if (onFlush) pendingClientFlushes.push({ name, fn: onFlush });
    }
}

export function startServer() {
    Players.PlayerRemoving.Connect((player) => {
        readyPlayers.delete(player);
        reliableChannels.delete(player);
        unreliableChannels.delete(player);

        const remaining = pendingQueue.filter((e) => e.player !== player);
        pendingQueue.clear();
        for (const entry of remaining) pendingQueue.push(entry);

        Logger.print("Server", `${player.Name} removed`);
    });

    startHeartbeat(reliableChannels, unreliableChannels, readyPlayers);
}

export function startClient() {
    const _reliable = reliable();

    const readyWriter = new Writer(1);
    readyWriter.u8(READY_BYTE);
    _reliable.FireServer(readyWriter.toBuffer());
    Logger.print("Client", "Fired ready to server");

    startClientHeartbeat(reliableChannel, unreliableChannel, () => {
        for (const entry of pendingClientFlushes) entry.fn(getStats(entry.name));
        pendingClientFlushes.clear();
    });
}

export function onPlayerReady(player: Player) {
    readyPlayers.add(player);
    flushPending(player, getChannel);
    Logger.print("Server", `${player.Name} ready`);
}

export function isReady(player: Player) {
    return readyPlayers.has(player);
}

export default { send, write, startServer, startClient, onPlayerReady, isReady };
