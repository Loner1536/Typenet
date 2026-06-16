//!native

// Internal
import type * as Type from "@type";

// Binary
import Registry from "@binary/registry";

// Transport
import { acquireBuilder, acquireEntry } from "@transport/queue";

type Handler<T> = (data: T, player: Player) => void;

type Signal<T> = {
    Connect(handler: Handler<T>): Type.Connection;
    Once(handler: Handler<T>): Type.Connection;
    Fire(data: T, player: Player): void;
};

function createSignal<T>(): Signal<T> {
    const handlers: Handler<T>[] = [];

    return {
        Connect(handler) {
            handlers.push(handler);
            return {
                Disconnect() {
                    const i = handlers.indexOf(handler);
                    if (i !== -1) handlers.unorderedRemove(i);
                },
            };
        },
        Once(handler) {
            const wrapped: Handler<T> = (data, player) => {
                conn.Disconnect();
                handler(data, player);
            };
            handlers.push(wrapped);
            const conn: Type.Connection = {
                Disconnect() {
                    const i = handlers.indexOf(wrapped);
                    if (i !== -1) handlers.unorderedRemove(i);
                },
            };
            return conn;
        },
        Fire(data, player) {
            for (const handler of handlers) handler(data, player);
        },
    };
}

function createBuilder(id: number, data: unknown): Type.Packet.Builder {
    return acquireBuilder(acquireEntry(id, data));
}

export function packet(): Type.Packet.Definition<void>;
export function packet<T>(codec: Type.Codec.External<T>): Type.Packet.Definition<T>;
export function packet<T>(codec?: Type.Codec.External<T>): Type.Packet.Definition<T> {
    return {
        codec: codec as Type.Codec.Internal<T>,
        _kind: "Packet",
    } as Type.Packet.Definition<T>;
}

export default function definePacket(id: string): Type.Packet.Object<void>;
export default function definePacket<T>(
    id: string,
    codec: Type.Codec.External<T>,
): Type.Packet.Object<T>;
export default function definePacket<T>(id: string, codec?: Type.Codec.External<T>) {
    Registry.register(id, codec as Type.Codec.Internal<unknown>);

    const entry = Registry.fromName(id);
    if (!entry) error(`[Packet] Failed to register: ${id}`);

    const signal = createSignal<T>();
    Registry.setHandler(id, (data, player) => signal.Fire(data as T, player));

    if (!codec) {
        return {
            fire() {
                return createBuilder(entry.id, undefined);
            },
            broadcast() {
                return createBuilder(entry.id, undefined);
            },
            connect(handler: (player?: Player) => void) {
                return signal.Connect((_, p) => handler(p));
            },
            once(handler: (player?: Player) => void) {
                return signal.Once((_, p) => handler(p));
            },
        } as unknown as Type.Packet.Object<void>;
    }

    return {
        fire(data: T) {
            return createBuilder(entry.id, data);
        },
        broadcast(data: T) {
            return createBuilder(entry.id, data);
        },
        connect(handler: (data: T, player?: Player) => void) {
            return signal.Connect(handler);
        },
        once(handler: (data: T, player?: Player) => void) {
            return signal.Once(handler);
        },
    } as unknown as Type.Packet.Object<T>;
}
