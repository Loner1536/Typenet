// Types
import type { Reader } from "./transport/reader";
import * as Types from "./types";

/**
 * Wraps an InternalCodec as the public Codec type, hiding encode/decode/measure.
 */
export function makeCodec<T>(codec: Types.InternalCodec<T>): Types.Codec<T> {
	return codec as unknown as Types.Codec<T>;
}

/**
 * Writes a variable-length integer (1 or 2 bytes).
 * Values < 128 fit in 1 byte. Values 128–16383 use 2 bytes with the high bit as a continuation flag.
 * @returns number of bytes written
 */
export function writeVarLen(buf: buffer, offset: number, len: number): number {
	if (len < 128) {
		buffer.writeu8(buf, offset, len);
		return 1;
	} else {
		buffer.writeu8(buf, offset, (len & 0x7f) | 0x80);
		buffer.writeu8(buf, offset + 1, len >> 7);
		return 2;
	}
}

/**
 * Reads a variable-length integer written by writeVarLen.
 */
export function readVarLen(reader: Reader): number {
	const first = reader.readu8();
	if ((first & 0x80) === 0) return first;
	return (first & 0x7f) | (reader.readu8() << 7);
}

/**
 * Returns how many bytes writeVarLen will use for `len`.
 */
export function varLenSize(len: number): number {
	return len < 128 ? 1 : 2;
}
