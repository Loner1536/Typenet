// Package
import { RunService, Players } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Codec
import Reader from "../serial/reader";

// Channel
import { reliable, unreliable } from "./wire";
import { onPlayerReady } from "./outbound";

// Debug
import Stats from "../debug/stats";

const IS_SERVER = RunService.IsServer();
const READY_BYTE = 0;

type ServerListener = (reader: Reader, player: Player) => void;
type ClientListener = (reader: Reader) => void;

const serverListeners = new Map<number, Set<ServerListener>>();
const clientListeners = new Map<number, Set<ClientListener>>();

function handleServer(data: buffer, player: Player) {
    const reader = new Reader(data);
    const len = buffer.len(data);

    while (reader.offset < len) {
        const packetId = reader.u8();

        if (packetId === READY_BYTE) {
            onPlayerReady(player);
            return;
        }

        const set = serverListeners.get(packetId);
        if (set) for (const fn of set) fn(reader, player);
    }
}

function handleClient(data: buffer) {
    const reader = new Reader(data);
    const len = buffer.len(data);

    while (reader.offset < len) {
        const packetId = reader.u8();
        const set = clientListeners.get(packetId);
        if (set) for (const fn of set) fn(reader);
    }
}

export function createConnection(disconnect: () => void): RBXScriptConnection {
    return {
        Connected: true,
        Disconnect() {
            if (!this.Connected) return;
            this.Connected = false;
            disconnect();
        },
    };
}

export function createListener<T>(
    id: number,
    codec: Types.InternalCodec<T> | undefined,
    tracker: Stats,
    fn: (data: T, player?: Player) => void,
    withStats?: (data: T, stats: Types.PacketStats | undefined, player?: Player) => void,
): RBXScriptConnection {
    const handle = (reader: Reader, player?: Player) => {
        let data: T;

        if (codec) {
            const before = reader.offset;

            data = codec.decode(reader);
            tracker.trackReceive(reader.offset - before + 1);
        } else {
            data = undefined as T;
            tracker.trackReceive(1);
        }

        const resolvedPlayer = IS_SERVER ? player : Players.LocalPlayer;

        if (codec) {
            fn(data, resolvedPlayer);
        } else {
            (fn as unknown as (player?: Player) => void)(resolvedPlayer);
        }

        if (withStats) {
            const snap = tracker.snapshot();
            if (codec) {
                withStats(data, snap, resolvedPlayer);
            } else {
                (
                    withStats as unknown as (
                        stats: Types.PacketStats | undefined,
                        player?: Player,
                    ) => void
                )(snap, resolvedPlayer);
            }
        }
    };

    if (IS_SERVER) {
        const serverListener = (reader: Reader, player: Player) => handle(reader, player);
        listen(id, serverListener);
        return createConnection(() => unlisten(id, serverListener));
    } else {
        const clientListener = (reader: Reader) => handle(reader);
        listen(id, clientListener);
        return createConnection(() => unlisten(id, clientListener));
    }
}

export function listen(id: number, fn: ServerListener | ClientListener) {
    if (IS_SERVER) {
        if (!serverListeners.has(id)) serverListeners.set(id, new Set());
        serverListeners.get(id)!.add(fn as ServerListener);
    } else {
        if (!clientListeners.has(id)) clientListeners.set(id, new Set());
        clientListeners.get(id)!.add(fn as ClientListener);
    }
}

export function unlisten(id: number, fn: ServerListener | ClientListener) {
    if (IS_SERVER) {
        serverListeners.get(id)?.delete(fn as ServerListener);
    } else {
        clientListeners.get(id)?.delete(fn as ClientListener);
    }
}

export function start() {
    const _reliable = reliable();
    const _unreliable = unreliable();

    if (IS_SERVER) {
        _reliable.OnServerEvent.Connect((player, data) => handleServer(data as buffer, player));
        _unreliable.OnServerEvent.Connect((player, data) => handleServer(data as buffer, player));
    } else {
        _reliable.OnClientEvent.Connect(handleClient);
        _unreliable.OnClientEvent.Connect(handleClient);
    }
}

export default { start, listen, unlisten, createListener, createConnection };
