// Transport
import { Reader } from "../transport/reader";

// Codec
import * as Types from "../types";

type CallableCodec = Types.Codec<string> & ((maxLength?: number) => Types.Codec<string>);

const setmetatableAs = setmetatable as unknown as (
	obj: Types.InternalCodec<string>,
	meta: { __call: (self: unknown, maxLength?: number) => Types.Codec<string> },
) => CallableCodec;

function makeStr(maxLength?: number): Types.InternalCodec<string> {
	const bounded = maxLength !== undefined;
	const prefixSize = bounded && maxLength! <= 255 ? 1 : 2;

	if (!bounded) {
		return {
			encode(buf, offset, value) {
				const bytes = buffer.fromstring(value);
				const len = buffer.len(bytes);
				const ps = len < 128 ? 1 : 2;
				if (len < 128) {
					buffer.writeu8(buf, offset, len);
				} else {
					buffer.writeu8(buf, offset, (len & 0x7f) | 0x80);
					buffer.writeu8(buf, offset + 1, len >> 7);
				}
				buffer.copy(buf, offset + ps, bytes, 0, len);
			},
			decode(reader) {
				const first = reader.readu8();
				const len = (first & 0x80) === 0 ? first : (first & 0x7f) | (reader.readu8() << 7);
				return reader.readbytes(len);
			},
			measure(value) {
				const len = buffer.len(buffer.fromstring(value));
				return (len < 128 ? 1 : 2) + len;
			},
		};
	}

	const writePrefix =
		prefixSize === 1
			? (buf: buffer, offset: number, len: number) => buffer.writeu8(buf, offset, len)
			: (buf: buffer, offset: number, len: number) => buffer.writeu16(buf, offset, len);

	const readPrefix =
		prefixSize === 1 ? (reader: Reader) => reader.readu8() : (reader: Reader) => reader.readu16();

	return {
		encode(buf, offset, value) {
			const bytes = buffer.fromstring(value);
			const len = buffer.len(bytes);
			if (bounded) assert(len <= maxLength!, `[Net] String exceeds maxLength of ${maxLength}`);
			writePrefix(buf, offset, len);
			buffer.copy(buf, offset + prefixSize, bytes, 0, len);
		},
		decode(reader) {
			const len = readPrefix(reader);
			if (bounded)
				assert(len <= maxLength!, `[Net] Incoming string exceeds maxLength of ${maxLength}`);
			return reader.readbytes(len);
		},
		measure(value) {
			const len = buffer.len(buffer.fromstring(value));
			if (bounded) assert(len <= maxLength!, `[Net] String exceeds maxLength of ${maxLength}`);
			return prefixSize + len;
		},
	};
}

/**
 * String codec with optional max length bound.
 * Uses a 1-byte length prefix if maxLength <= 255, otherwise 2 bytes.
 *
 * Wire format: [u8 or u16 byte length][utf-8 bytes]
 *
 * @example
 * t.str        // unbounded, 2-byte length prefix
 * t.str(32)    // bounded to 32 bytes, 1-byte length prefix
 */
export const str = setmetatableAs(makeStr(), {
	__call: (_self, maxLength) => makeStr(maxLength) as unknown as Types.Codec<string>,
});
