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
type Encoder = (writer: Writer) => void;

const listeners = new Map<number, Set<Listener>>();

const reliableChannel = new Writer(512);
const unreliableChannel = new Writer(512);

function handle(data: buffer) {
    const reader = new Reader(data);
    const len = buffer.len(data);

    while (reader.offset < len) {
        const packetId = reader.u8();
        const set = listeners.get(packetId);
        if (set) for (const fn of set) fn(reader);
    }
}

export function start() {
    assert(!RunService.IsServer(), "Client can only start on the client");

    const _reliable = reliable();
    const _unreliable = unreliable();

    _reliable.OnClientEvent.Connect(handle);
    _unreliable.OnClientEvent.Connect(handle);

    const readyWriter = new Writer(1);
    readyWriter.u8(READY_BYTE);
    _reliable.FireServer(readyWriter.toBuffer());
    Logger.print(FROM, "Fired ready to server");

    RunService.Heartbeat.Connect(() => {
        if (reliableChannel.cursor > 0) {
            _reliable.FireServer(reliableChannel.toBuffer());
            reliableChannel.reset();
        }
        if (unreliableChannel.cursor > 0) {
            _unreliable.FireServer(unreliableChannel.toBuffer());
            unreliableChannel.reset();
        }
    });
}

export function write(encode: Encoder, isUnreliable: boolean) {
    encode(isUnreliable ? unreliableChannel : reliableChannel);
}

export function listen(packetId: number, fn: Listener) {
    if (!listeners.has(packetId)) listeners.set(packetId, new Set());
    listeners.get(packetId)!.add(fn);
}

export function unlisten(packetId: number, fn: Listener) {
    listeners.get(packetId)?.delete(fn);
}

export default { start, write, listen, unlisten };
