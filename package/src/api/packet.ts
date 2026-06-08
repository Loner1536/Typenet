//!optimize 2
//!native

// Transport
import Outbound from "@transport/outbound";
import Registry from "@transport/registry";

// Internal
import * as Type from "@type";

// Security
import Report from "@security/report";

export default function definePacket(
    name: string,
    options?: Type.Packet.Options,
): Type.Packet.Definition<undefined>;
export default function definePacket<T>(
    name: string,
    codec: Type.Codec.External<T>,
    options?: Type.Packet.Options,
): Type.Packet.Definition<T>;
export default function definePacket<T>(
    name: string,
    codecOrOptions?: Type.Codec.External<T> | Type.Packet.Options,
    options?: Type.Packet.Options,
) {
    let codec: Type.Codec.Internal<T> | undefined;
    let opts: Type.Packet.Options | undefined;

    if (codecOrOptions !== undefined && "write" in (codecOrOptions as object)) {
        codec = codecOrOptions as Type.Codec.Internal<T>;
        opts = options;
    } else {
        codec = undefined;
        opts = codecOrOptions as Type.Packet.Options | undefined;
    }

    const unreliable = opts?.unreliable ?? false;

    const def = Registry.register(
        name,
        codec as Type.Codec.Internal<unknown> | undefined,
        unreliable,
    );

    Report.log("debug", "PACKET_DEFINED", { name, unreliable });

    function send(dataOrTarget?: T | Type.Target, target?: Type.Target) {
        if (def.id === 0) {
            Report.log("warn", "PACKET_SEND_BEFORE_START", { name });
            return;
        }

        const resolvedData = codec !== undefined ? (dataOrTarget as T) : undefined;
        const resolvedTarget =
            codec !== undefined ? target : (dataOrTarget as Type.Target | undefined);

        Outbound.send(def.id, codec, resolvedData, resolvedTarget, unreliable, opts?.xor);
    }

    function on(handler: (player: Player, data: T) => void) {
        Registry.setHandler(name, handler as (player: Player, data: unknown) => void);
    }

    return { send, on } as Type.Packet.Definition<T>;
}
