// Package
import { HttpService } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Codec
import type Reader from "./reader";

export function decode<T>(codec: Types.InternalCodec<T>, reader: Reader): [T, number] {
    if (codec._raw) {
        const json = reader.string();
        const [ok, decoded] = pcall(() => HttpService.JSONDecode(json));
        const bytes = buffer.len(buffer.fromstring(json));
        return [ok ? (decoded as T) : (undefined as T), bytes];
    } else {
        const start = reader.offset;
        const [decoded] = codec.decode(reader);
        return [decoded, reader.offset - start];
    }
}
