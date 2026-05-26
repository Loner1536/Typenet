// Types
import * as Types from "../types";

// Internal
import Logger from "../debug/logger";

// API
import { definePacket } from "./packet";

const FROM = "Channel";

type ChannelSchema = Record<string, Types.PacketDefinition<unknown>>;

type ResolvedChannel<S extends ChannelSchema> = {
    [K in keyof S]: S[K] extends Types.PacketDefinition<infer T>
    ? ReturnType<typeof definePacket<T>>
    : never;
};

export default function Channel<S extends ChannelSchema>(
    name: string,
    schema: S,
): ResolvedChannel<S> {
    const result = {} as ResolvedChannel<S>;

    for (const [key, definition] of pairs(schema as ChannelSchema)) {
        const packetName = `${name}/${key}`;

        (result as Record<string, unknown>)[key as string] = definePacket(
            packetName,
            definition._codec as Types.Codec<unknown>,
            { unreliable: definition._unreliable },
        );
        Logger.print(FROM, `Registered packet "${packetName}"`);
    }

    return result;
}
