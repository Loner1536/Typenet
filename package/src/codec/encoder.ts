// Package
import { HttpService } from "@rbxts/services";

// Codec
import Writer from "./writer";

export function encode<T>(
    id: number,
    codec: { encode: (writer: Writer, value: T) => void },
    value: T,
): [string, number] {
    const writer = new Writer(64);
    writer.u8(id);
    codec.encode(writer, value);
    const buf = writer.toBuffer();
    return [buffer.tostring(buf), buffer.len(buf)];
}

export function encodeRaw(id: number, value: unknown): [string, number] {
    const writer = new Writer(64);
    writer.u8(id);
    writer.string(HttpService.JSONEncode(value));
    const buf = writer.toBuffer();
    return [buffer.tostring(buf), buffer.len(buf)];
}

export function encodeEmpty(id: number): string {
    const writer = new Writer(1);
    writer.u8(id);
    return buffer.tostring(writer.toBuffer());
}
