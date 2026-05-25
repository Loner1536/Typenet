// Package
import { HttpService } from "@rbxts/services";

// Root
import * as Types from "../../types";

const encode: Types.InternalCodec<unknown>["encode"] = (writer, value) => {
    writer.string(HttpService.JSONEncode(value));
};
const decode: Types.InternalCodec<unknown>["decode"] = (reader) => {
    const json = reader.string();
    const [ok, decoded] = pcall(() => HttpService.JSONDecode(json));
    return [ok ? decoded : undefined, -1] as LuaTuple<[unknown, number]>;
};

export default {
    encode,
    decode,
} as Types.InternalCodec<unknown> as Types.Codec<unknown>;
