// Types
import * as Types from "../types";

// API
import { definePacket } from "./packet";
import { defineQuery } from "./query";

type ChannelSchema = Record<
    string,
    Types.PacketDefinition<unknown> | Types.QueryDefinition<unknown, unknown>
>;

type ResolvedChannel<S extends ChannelSchema> = {
    [K in keyof S]: S[K] extends Types.QueryDefinition<infer Req, infer Res>
    ? ReturnType<typeof defineQuery<Req, Res>>
    : S[K] extends Types.PacketDefinition<infer T>
    ? ReturnType<typeof definePacket<T>>
    : never;
};

export default function Channel<S extends ChannelSchema>(
    name: string,
    schema: S,
): ResolvedChannel<S> {
    const result = {} as ResolvedChannel<S>;

    const ordered: [
        string,
        Types.PacketDefinition<unknown> | Types.QueryDefinition<unknown, unknown>,
    ][] = [];
    for (const [key, def] of pairs(schema as ChannelSchema)) {
        ordered.push([key, def]);
    }
    ordered.sort((a, b) => a[0] < b[0]);

    for (const [key, definition] of ordered) {
        const packetName = `${name}/${key}`;

        if ("_responseCodec" in definition) {
            (result as Record<string, unknown>)[key as string] = defineQuery(
                packetName,
                definition._requestCodec as Types.Codec<unknown>,
                definition._responseCodec as Types.Codec<unknown>,
            );
        } else {
            (result as Record<string, unknown>)[key as string] = definePacket(
                packetName,
                definition._codec as Types.Codec<unknown>,
                { unreliable: definition._unreliable },
            );
        }
    }

    return result;
}
