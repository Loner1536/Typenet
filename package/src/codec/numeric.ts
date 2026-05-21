// Codec
import * as Types from "../types";

function makeCodec<T>(codec: Types.InternalCodec<T>): Types.Codec<T> {
	return codec as unknown as Types.Codec<T>;
}

/** Encodes/decodes an unsigned 8-bit integer (0–255). Wire size: 1 byte. */
export const u8: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writeu8(buf, offset, value);
	},
	decode(reader) {
		return reader.readu8();
	},
	measure() {
		return 1;
	},
});

/** Encodes/decodes an unsigned 16-bit integer (0–65535). Wire size: 2 bytes. */
export const u16: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writeu16(buf, offset, value);
	},
	decode(reader) {
		return reader.readu16();
	},
	measure() {
		return 2;
	},
});

/** Encodes/decodes an unsigned 32-bit integer (0–4294967295). Wire size: 4 bytes. */
export const u32: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writeu32(buf, offset, value);
	},
	decode(reader) {
		return reader.readu32();
	},
	measure() {
		return 4;
	},
});

/** Encodes/decodes a signed 8-bit integer (-128–127). Wire size: 1 byte. */
export const i8: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writei8(buf, offset, value);
	},
	decode(reader) {
		return reader.readi8();
	},
	measure() {
		return 1;
	},
});

/** Encodes/decodes a signed 16-bit integer (-32768–32767). Wire size: 2 bytes. */
export const i16: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writei16(buf, offset, value);
	},
	decode(reader) {
		return reader.readi16();
	},
	measure() {
		return 2;
	},
});

/** Encodes/decodes a signed 32-bit integer (-2147483648–2147483647). Wire size: 4 bytes. */
export const i32: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writei32(buf, offset, value);
	},
	decode(reader) {
		return reader.readi32();
	},
	measure() {
		return 4;
	},
});

/** Encodes/decodes a 32-bit float. Wire size: 4 bytes. Precision loss may occur. */
export const f32: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writef32(buf, offset, value);
	},
	decode(reader) {
		return reader.readf32();
	},
	measure() {
		return 4;
	},
});

/** Encodes/decodes a 64-bit float. Wire size: 8 bytes. Full Luau number precision. */
export const f64: Types.Codec<number> = makeCodec<number>({
	encode(buf, offset, value) {
		buffer.writef64(buf, offset, value);
	},
	decode(reader) {
		return reader.readf64();
	},
	measure() {
		return 8;
	},
});

/**
 * Automatically selects the smallest codec that fits the given range.
 * Picks unsigned or signed integers for whole-number ranges, and f64 otherwise.
 *
 * @param min - The minimum allowed value (inclusive).
 * @param max - The maximum allowed value (inclusive).
 *
 * @example
 * t.num(0, 100)      // → u8
 * t.num(-50, 50)     // → i8
 * t.num(0.0, 1.0)    // → f64
 */
export function num(min: number, max: number): Types.Codec<number> {
	assert(min <= max, "[Net] num: min must be <= max");

	const isWhole = min === math.floor(min) && max === math.floor(max);

	let inner: Types.InternalCodec<number>;

	if (isWhole && min >= 0) {
		if (max <= 0xff) inner = u8 as unknown as Types.InternalCodec<number>;
		else if (max <= 0xffff) inner = u16 as unknown as Types.InternalCodec<number>;
		else if (max <= 0xffffffff) inner = u32 as unknown as Types.InternalCodec<number>;
		else inner = f64 as unknown as Types.InternalCodec<number>;
	} else if (isWhole && min < 0) {
		if (min >= -128 && max <= 127) inner = i8 as unknown as Types.InternalCodec<number>;
		else if (min >= -32768 && max <= 32767) inner = i16 as unknown as Types.InternalCodec<number>;
		else if (min >= -2147483648 && max <= 2147483647)
			inner = i32 as unknown as Types.InternalCodec<number>;
		else inner = f64 as unknown as Types.InternalCodec<number>;
	} else {
		inner = f64 as unknown as Types.InternalCodec<number>;
	}

	return makeCodec<number>({
		encode(buf, offset, value) {
			assert(
				value >= min && value <= max,
				`[Net] num: value ${value} out of range [${min}, ${max}]`,
			);
			inner.encode(buf, offset, value);
		},
		decode(reader) {
			const value = inner.decode(reader);
			assert(
				value >= min && value <= max,
				`[Net] num: decoded value ${value} out of range [${min}, ${max}]`,
			);
			return value;
		},
		measure() {
			return inner.measure(0);
		},
	});
}
