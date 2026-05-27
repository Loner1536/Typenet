// Package
import { RunService, Players } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Serial
import Writer from "../serial/writer";

// Channel
import { reliable } from "./wire";

// Scheduler
import { pendingQueue, pendingBroadcasts, flushPending } from "../scheduler/queue";
import { startHeartbeat, startClientHeartbeat } from "../scheduler/heartbeat";

// Debug
import { getStats } from "../debug/stats";
import Logger from "../debug/logger";

// Helper
import estimatePacketSize from "../helper/estimate_packet_size";

const IS_SERVER = RunService.IsServer();
const READY_BYTE = 0;

type Encoder = (writer: Writer) => void;

const readyPlayers = new Set<Player>();
const reliableChannels = new Map<Player, Writer>();
const unreliableChannels = new Map<Player, Writer>();

const reliableChannel = new Writer(512);
const unreliableChannel = new Writer(512);

function getChannel(player: Player, isUnreliable: boolean): Writer {
    const map = isUnreliable ? unreliableChannels : reliableChannels;
    let ch = map.get(player);
    if (!ch) {
        ch = new Writer(512);
        map.set(player, ch);
    }

    return ch;
}

function writeServer(name: string, player: Player | "All", encode: Encoder, isUnreliable: boolean) {
    if (player === "All") {
        if (readyPlayers.size() === 0) {
            pendingBroadcasts.push({ name, encode, unreliable: isUnreliable });
        } else {
            for (const rp of readyPlayers) {
                encode(getChannel(rp, isUnreliable));
            }
        }
    } else {
        if (readyPlayers.has(player)) {
            encode(getChannel(player, isUnreliable));
        } else {
            pendingQueue.push({ name, player, encode, unreliable: isUnreliable });
        }
    }
}

export function send<T>(
    id: number,
    name: string,
    codec: Types.InternalCodec<T> | undefined,
    isUnreliable: boolean,
    dataOrTarget?: T | Types.SendTarget,
    target?: Types.SendTarget,
) {
    const encode = (writer: Writer) => {
        const before = writer.cursor;
        writer.u8(id);
        const afterId = writer.cursor;
        if (codec) codec.encode(writer, dataOrTarget as T);
        const after = writer.cursor;

        const tracker = getStats(name);
        if (tracker) {
            const rawBytes = after - afterId;
            const sliced = writer.slice(before, after - before);
            const wireBytes = estimatePacketSize(
                IS_SERVER ? "Server" : "Client",
                "RemoteEvent",
                sliced,
            );
            tracker.trackSend(rawBytes, wireBytes);
        }
    };

    if (IS_SERVER) {
        const resolvedTarget = codec ? target : (dataOrTarget as Types.SendTarget);
        if (!resolvedTarget) {
            writeServer(name, "All", encode, isUnreliable);
        } else if (typeIs(resolvedTarget, "Instance") && resolvedTarget.IsA("Player")) {
            writeServer(name, resolvedTarget, encode, isUnreliable);
        } else if (typeIs(resolvedTarget, "table") && !("Except" in (resolvedTarget as object))) {
            for (const player of resolvedTarget as Player[]) {
                writeServer(name, player, encode, isUnreliable);
            }
        } else {
            const [, excluded] = resolvedTarget as ["Except", Player | Player[]];
            const excludedSet = new Set<Player>(
                typeIs(excluded, "Instance") ? [excluded] : (excluded as Player[]),
            );
            for (const player of Players.GetPlayers()) {
                if (!excludedSet.has(player)) {
                    writeServer(name, player, encode, isUnreliable);
                }
            }
        }
    } else {
        encode(isUnreliable ? unreliableChannel : reliableChannel);
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

    startClientHeartbeat(reliableChannel, unreliableChannel);
}

export function onPlayerReady(player: Player) {
    readyPlayers.add(player);

    const flushed = flushPending(player, [...pendingQueue]);
    for (const entry of flushed) {
        entry.encode(getChannel(player, entry.unreliable));
    }

    for (const entry of pendingBroadcasts) {
        entry.encode(getChannel(player, entry.unreliable));
    }

    Logger.print("Server", `${player.Name} ready`);
}

export function isReady(player: Player) {
    return readyPlayers.has(player);
}

export default { send, startServer, startClient, onPlayerReady, isReady };
