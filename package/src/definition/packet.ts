// Types
import * as Types from "../types";

// Channel
import { send as sendPacket } from "../channel/outbound";
import { createListener } from "../channel/inbound";

// Definition
import { register } from "../definition/registry";

// Debug
import Logger from "../debug/logger";
import Stats, { getStats } from "../debug/stats";
import { isStats } from "../debug/config";

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
    const id = register(name);

    if (isStats()) new Stats(name);

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

    const on = (fn: (data: T, player?: Player) => void) => {
        let statsFn:
            | ((data: T, stats: Types.PacketStats | undefined, player?: Player) => void)
            | undefined;

        const connection = createListener(id, name, codec, (data, player) => {
            fn(data, player);
            if (statsFn) statsFn(data, getStats(name)?.snapshot(), player);
        });

        return {
            stats: (sf?: typeof statsFn): RBXScriptConnection => {
                statsFn =
                    sf ??
                    ((_data, stats, _player) => {
                        print(`[TYPENET] ${name} received:`, stats);
                    });
                return connection;
            },
            Disconnect: () => connection.Disconnect(),
        };
    };

    const once = (fn: (data: T, player?: Player) => void) => {
        let connection!: ReturnType<typeof on>;
        connection = on((data, player) => {
            connection.Disconnect();
            fn(data, player);
        });

        return {
            stats: (
                statsFn?: (data: T, stats: Types.PacketStats | undefined, player?: Player) => void,
            ): RBXScriptConnection => {
                return connection.stats(statsFn);
            },
            Disconnect: () => connection.Disconnect(),
        };
    };

    const send = (dataOrTarget?: T | Types.SendTarget, target?: Types.SendTarget) => {
        sendPacket(id, name, codec, unreliable, dataOrTarget, target);

        return {
            stats: (fn?: (stats: Types.PacketStats | undefined) => void) => {
                const snap = getStats(name)?.snapshot();
                if (fn) {
                    fn(snap);
                } else {
                    print(`[TYPENET] ${name} sent:`, snap);
                }
            },
        };
    };

    return { send, on, once } as Types.Packet<T>;
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
