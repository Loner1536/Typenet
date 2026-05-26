// Package
import { HttpService } from "@rbxts/services";

// Root
import * as Types from "../../types";

export default {
    encode: (writer, value) => {
        writer.string(HttpService.JSONEncode(value));
    },
    decode: (reader) => {
        const json = reader.string();
        const [ok, decoded] = pcall(() => HttpService.JSONDecode(json));
        return ok ? decoded : undefined;
    },
} as Types.InternalCodec<unknown> as Types.Codec<unknown>;
