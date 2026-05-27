// Package
import { RunService, Players } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Serial
import Reader from "../serial/reader";

// Channel
import { reliable, unreliable } from "./wire";
import { onPlayerReady } from "./outbound";

// Debug
import { getStats } from "../debug/stats";

// Helper
import estimatePacketSize from "../helper/estimate_packet_size";

const IS_SERVER = RunService.IsServer();
const READY_BYTE = 0;

type ServerListener = (reader: Reader, player: Player) => void;
type ClientListener = (reader: Reader) => void;

const serverListeners = new Map<number, Set<ServerListener>>();
const clientListeners = new Map<number, Set<ClientListener>>();

function handleServer(data: buffer, player: Player) {
    const reader = new Reader(data);
    const len = buffer.len(data);

    while (reader.cursor < len) {
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

    while (reader.cursor < len) {
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
    name: string,
    codec: Types.InternalCodec<T> | undefined,
    fn: (data: T, player?: Player) => void,
): RBXScriptConnection {
    const senderContext = IS_SERVER ? "Client" : "Server";

    const handle = (reader: Reader, player?: Player) => {
        const tracker = getStats(name);
        let data: T;

        if (codec) {
            const before = reader.cursor;
            data = codec.decode(reader);
            const rawBytes = reader.cursor - before;

            if (tracker) {
                const sliced = reader.slice(before, rawBytes);
                const wireBytes = estimatePacketSize(senderContext, "RemoteEvent", sliced);
                tracker.trackReceive(rawBytes, wireBytes);
            }
        } else {
            data = undefined as T;
            if (tracker)
                tracker.trackReceive(
                    0,
                    estimatePacketSize(senderContext, "RemoteEvent", buffer.create(0)),
                );
        }

        const resolvedPlayer = IS_SERVER ? player : Players.LocalPlayer;
        fn(data, resolvedPlayer);
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
