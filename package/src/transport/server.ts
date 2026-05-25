// Package
import { Players, RunService } from "@rbxts/services";

// Internal
import Logger from "../internal/logger";

// Codec
import Reader from "../codec/reader";

// Transport
import { reliable, unreliable } from "./wire";

const FROM = "Server";

type Listener = (reader: Reader, player: Player) => void;

type QueueEntry = { data: string; player: Player; unreliable: boolean };
type BroadcastEntry = { data: string; unreliable: boolean };

const readyPlayers = new Set<Player>();
const listeners = new Map<number, Set<Listener>>();
const pendingBroadcasts: BroadcastEntry[] = [];
const broadcastQueue: BroadcastEntry[] = [];
const pendingQueue: QueueEntry[] = [];
const outQueue: QueueEntry[] = [];

const READY_BYTE = 0;

function handle(data: string, player: Player) {
    const buf = buffer.fromstring(data);
    const reader = new Reader(buf);
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

function flushPending(player: Player) {
    const remaining: QueueEntry[] = [];
    for (const entry of pendingQueue) {
        if (entry.player === player) {
            outQueue.push(entry);
        } else {
            remaining.push(entry);
        }
    }
    pendingQueue.clear();
    for (const entry of remaining) pendingQueue.push(entry);

    for (const entry of pendingBroadcasts) {
        outQueue.push({ data: entry.data, player, unreliable: entry.unreliable });
    }

    Logger.print(FROM, `Flushed pending for ${player.Name}`);
}

export function start() {
    assert(RunService.IsServer(), "Server can only start on the server");

    const _reliable = reliable();
    const _unreliable = unreliable();

    _reliable.OnServerEvent.Connect((player, data) => handle(data as string, player));
    _unreliable.OnServerEvent.Connect((player, data) => handle(data as string, player));

    Players.PlayerRemoving.Connect((player) => {
        readyPlayers.delete(player);
        const remaining = pendingQueue.filter((e) => e.player !== player);
        pendingQueue.clear();
        for (const entry of remaining) pendingQueue.push(entry);
        Logger.print(FROM, `${player.Name} removed`);
    });

    RunService.Heartbeat.Connect(() => {
        for (const entry of broadcastQueue) {
            for (const player of readyPlayers) {
                if (entry.unreliable) {
                    _unreliable.FireClient(player, entry.data);
                } else {
                    _reliable.FireClient(player, entry.data);
                }
            }
        }
        broadcastQueue.clear();

        for (const entry of outQueue) {
            if (entry.unreliable) {
                _unreliable.FireClient(entry.player, entry.data);
            } else {
                _reliable.FireClient(entry.player, entry.data);
            }
        }
        outQueue.clear();
    });
}

export function queue(player: Player | "All", data: string, isUnreliable: boolean) {
    if (player === "All") {
        if (readyPlayers.size() === 0) {
            pendingBroadcasts.push({ data, unreliable: isUnreliable });
        } else {
            broadcastQueue.push({ data, unreliable: isUnreliable });
        }
        return;
    }
    if (readyPlayers.has(player)) {
        outQueue.push({ data, player, unreliable: isUnreliable });
    } else {
        pendingQueue.push({ data, player, unreliable: isUnreliable });
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

export default { start, flushPending, listen, unlisten, isReady, queue };
