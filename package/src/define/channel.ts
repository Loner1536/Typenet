// Internal
import type * as Type from "@type";

// Binary
import Registry from "@binary/registry";

function channel<T extends Record<string, Type.Channel.Definition>>(
    scope: string,
    defs: T,
): Type.Channel.Result<T> {
    const result = {} as Type.Channel.Result<T>;

    for (const [name, def] of pairs(defs as Record<string, Type.Packet.Definition<unknown>>)) {
        const id = `${scope}/${name as string}`;
        Registry.register(id, def.codec as Type.Codec.Internal<unknown>);
    }

    return result;
}

export default channel;
