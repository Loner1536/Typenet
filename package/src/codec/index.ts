// Package
import { HttpService } from "@rbxts/services";

// Root
import * as Types from "../types";

// Codec

const Codec = {
    unknown: {
        encode: (writer, value) => {
            writer.string(HttpService.JSONEncode(value));
        },
        decode: (reader) => {
            const json = reader.string();
            const [ok, decoded] = pcall(() => HttpService.JSONDecode(json));
            return [ok ? decoded : undefined, 0] as LuaTuple<[unknown, number]>;
        },
    } as Types.InternalCodec<unknown> as Types.Codec<unknown>,
};

export default Codec;
