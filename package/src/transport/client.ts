// Package
import { RunService } from "@rbxts/services";

// Internal
import Logger from "../internal/logger";

// Codec
import Reader from "../codec/reader";
import Writer from "../codec/writer";

// Transport
import { reliable, unreliable } from "./wire";

const FROM = "Client";
const READY_BYTE = 0;

type Listener = (reader: Reader) => void;
const listeners = new Map<number, Set<Listener>>();

export function start() {
    assert(!RunService.IsServer(), "Client can only start on the client");

    const _reliable = reliable();
    const _unreliable = unreliable();

    const handle = (data: string) => {
        const buf = buffer.fromstring(data);
        const reader = new Reader(buf);
        const packetId = reader.u8();
        const set = listeners.get(packetId);
        if (set) for (const fn of set) fn(reader);
    };

    _reliable.OnClientEvent.Connect(handle);
    _unreliable.OnClientEvent.Connect(handle);

    const writer = new Writer(1);
    writer.u8(READY_BYTE);
    _reliable.FireServer(buffer.tostring(writer.toBuffer()));
    Logger.print(FROM, "Fired ready to server");
}

export function send(data: unknown, isUnreliable: boolean) {
    const _reliable = reliable();
    const _unreliable = unreliable();

    if (!isUnreliable) {
        _reliable.FireServer(data);
    } else {
        _unreliable.FireServer(data);
    }
}

export function listen(packetId: number, fn: Listener) {
    if (!listeners.has(packetId)) listeners.set(packetId, new Set());
    listeners.get(packetId)!.add(fn);
}

export function unlisten(packetId: number, fn: Listener) {
    listeners.get(packetId)?.delete(fn);
}

export default { start, send, listen, unlisten };
