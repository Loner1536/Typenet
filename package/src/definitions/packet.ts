// Types
import * as Types from "../types";

// Channel
import { send as sendPacket } from "../channel/outbound";
import { createListener } from "../channel/inbound";

// Definitions
import Registry, { getStats } from "../definitions/registry";

// Debug
import Logger from "../debug/logger";

const FROM = "Packet";

export function definePacket(name: string, options?: Types.PacketOptions): Types.Packet<undefined>;
export function definePacket<T>(
    name: string,
    codec: Types.Codec<T>,
    options?: Types.PacketOptions,
): Types.Packet<T>;
export function definePacket<T>(
    name: string,
    codecOrOptions?: Types.Codec<T> | Types.PacketOptions,
    options?: Types.PacketOptions,
): Types.Packet<T | undefined> {
    const id = Registry.register(name);

    let codec: Types.InternalCodec<T> | undefined;
    let opts: Types.PacketOptions | undefined;

    if (codecOrOptions === undefined || "unreliable" in (codecOrOptions as object)) {
        opts = codecOrOptions as Types.PacketOptions | undefined;
        codec = undefined;
    } else {
        codec = codecOrOptions as Types.InternalCodec<T>;
        opts = options;
    }

    const unreliable = opts?.unreliable ?? false;
    Logger.print(FROM, `Registered packet "${name}" [id: ${id}]`);

    const on = (fn: (data: T, player?: Player) => void): RBXScriptConnection => {
        Logger.print(FROM, `Listener added to "${name}" [id: ${id}]`);
        const tracker = getStats(name);
        return createListener(id, codec, fn, tracker);
    };

    const once = (fn: (data: T, player?: Player) => void): RBXScriptConnection => {
        let connection!: RBXScriptConnection;
        connection = on((data, player) => {
            connection.Disconnect();
            fn(data, player);
        });
        return connection;
    };

    const send = (dataOrTarget?: T | Types.SendTarget, target?: Types.SendTarget) => {
        const tracker = getStats(name);
        sendPacket(id, codec, unreliable, tracker, dataOrTarget, target);
    };

    const statsOn = (
        fn: (data: T, stats: Types.PacketStats | undefined, player?: Player) => void,
    ): RBXScriptConnection => {
        Logger.print(FROM, `Stats listener added to "${name}" [id: ${id}]`);
        const tracker = getStats(name);
        return createListener(id, codec, () => { }, tracker, fn);
    };

    const stats = {
        snapshot: () => {
            const tracker = getStats(name);
            if (tracker) return tracker.snapshot();

            return undefined;
        },
        on: statsOn,
        once: (
            fn: (data: T, stats: Types.PacketStats | undefined, player?: Player) => void,
        ): RBXScriptConnection => {
            let connection!: RBXScriptConnection;
            connection = statsOn((data, s, player) => {
                connection.Disconnect();
                fn(data, s, player);
            });
            return connection;
        },
    };

    return { stats, send, once, on } as Types.Packet<T>;
}

export default function Packet(options?: Types.PacketOptions): Types.PacketDefinition<undefined>;
export default function Packet<T>(
    codec: Types.Codec<T>,
    options?: Types.PacketOptions,
): Types.PacketDefinition<T>;
export default function Packet<T>(
    codecOrOptions?: Types.Codec<T> | Types.PacketOptions,
    options?: Types.PacketOptions,
): Types.PacketDefinition<T | undefined> {
    if (codecOrOptions === undefined || "unreliable" in (codecOrOptions as object)) {
        return {
            _codec: undefined,
            _unreliable: (codecOrOptions as Types.PacketOptions)?.unreliable ?? false,
        };
    }
    return {
        _codec: codecOrOptions as Types.Codec<T>,
        _unreliable: options?.unreliable ?? false,
    };
}
