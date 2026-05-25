// Package
import { Players, RunService } from "@rbxts/services";

// Internal
import Logger from "../internal/logger";

// Codec
import Reader from "../codec/reader";
import Writer from "../codec/writer";

// Transport
import { reliable, unreliable } from "./wire";

const FROM = "Server";
const READY_BYTE = 0;

type Listener = (reader: Reader, player: Player) => void;
type Encoder = (writer: Writer) => void;

type PendingEntry = { player: Player; encode: Encoder; unreliable: boolean };
type PendingBroadcast = { encode: Encoder; unreliable: boolean };

const readyPlayers = new Set<Player>();

const listeners = new Map<number, Set<Listener>>();

const reliableChannels = new Map<Player, Writer>();
const unreliableChannels = new Map<Player, Writer>();

const pendingQueue: PendingEntry[] = [];
const pendingBroadcasts: PendingBroadcast[] = [];

function getChannel(player: Player, isUnreliable: boolean): Writer {
    const map = isUnreliable ? unreliableChannels : reliableChannels;
    let ch = map.get(player);
    if (!ch) {
        ch = new Writer(512);
        map.set(player, ch);
    }
    return ch;
}

function handle(data: buffer, player: Player) {
    const reader = new Reader(data);
    const len = buffer.len(data);

    while (reader.offset < len) {
        const packetId = reader.u8();

        if (packetId === READY_BYTE) {
            readyPlayers.add(player);
            Logger.print(FROM, `${player.Name} ready`);
            flushPending(player);
            return;
        }

        const set = listeners.get(packetId);
        if (set) for (const fn of set) fn(reader, player);
    }
}

function flushPending(player: Player) {
    const remaining: PendingEntry[] = [];
    for (const entry of pendingQueue) {
        if (entry.player === player) {
            entry.encode(getChannel(player, entry.unreliable));
        } else {
            remaining.push(entry);
        }
    }
    pendingQueue.clear();
    for (const entry of remaining) pendingQueue.push(entry);

    for (const entry of pendingBroadcasts) {
        entry.encode(getChannel(player, entry.unreliable));
    }

    Logger.print(FROM, `Flushed pending for ${player.Name}`);
}

export function start() {
    assert(RunService.IsServer(), "Server can only start on the server");

    const _reliable = reliable();
    const _unreliable = unreliable();

    _reliable.OnServerEvent.Connect((player, data) => handle(data as buffer, player));
    _unreliable.OnServerEvent.Connect((player, data) => handle(data as buffer, player));

    Players.PlayerRemoving.Connect((player) => {
        readyPlayers.delete(player);
        reliableChannels.delete(player);
        unreliableChannels.delete(player);

        const remaining = pendingQueue.filter((e) => e.player !== player);
        pendingQueue.clear();
        for (const entry of remaining) pendingQueue.push(entry);

        Logger.print(FROM, `${player.Name} removed`);
    });

    RunService.Heartbeat.Connect(() => {
        for (const player of readyPlayers) {
            const rCh = reliableChannels.get(player);
            if (rCh && rCh.cursor > 0) {
                _reliable.FireClient(player, rCh.toBuffer());
                rCh.reset();
            }

            const uCh = unreliableChannels.get(player);
            if (uCh && uCh.cursor > 0) {
                _unreliable.FireClient(player, uCh.toBuffer());
                uCh.reset();
            }
        }
    });
}

export function write(player: Player | "All", encode: Encoder, isUnreliable: boolean) {
    if (player === "All") {
        if (readyPlayers.size() === 0) {
            pendingBroadcasts.push({ encode, unreliable: isUnreliable });
        } else {
            for (const p of readyPlayers) {
                encode(getChannel(p, isUnreliable));
            }
        }
        return;
    }

    if (readyPlayers.has(player)) {
        encode(getChannel(player, isUnreliable));
    } else {
        pendingQueue.push({ player, encode, unreliable: isUnreliable });
    }
}

export function listen(packetId: number, fn: Listener) {
    if (!listeners.has(packetId)) listeners.set(packetId, new Set());
    listeners.get(packetId)!.add(fn);
}

export function unlisten(packetId: number, fn: Listener) {
    listeners.get(packetId)?.delete(fn);
}

export function isReady(player: Player) {
    return readyPlayers.has(player);
}

export default { start, write, listen, unlisten, isReady };
