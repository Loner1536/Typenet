// Package
import Object from "@rbxts/object-utils";

// Codec
import * as Types from "../types";

type StructSchema<T> = { [K in keyof T]: Types.Codec<T[K]> };

/**
 * struct<T>(schema) — encodes/decodes a plain object with fixed named fields.
 * No delta encoding — every field is always written in full.
 *
 * Wire format: [field0][field1]...[fieldN]
 *
 * @example
 * const Entity = t.struct({ x: t.u8, y: t.u8, z: t.u8 });
 */
export function struct<T extends object>(schema: StructSchema<T>): Types.Codec<T> {
	const entries = Object.entries(schema) as [keyof T, Types.InternalCodec<unknown>][];

	const codec: Types.InternalCodec<T> = {
		encode(buf, offset, value) {
			let cursor = offset;
			for (const [key, c] of entries) {
				const v = value[key];
				(c as Types.InternalCodec<typeof v>).encode(buf, cursor, v);
				cursor += (c as Types.InternalCodec<typeof v>).measure(v);
			}
		},
		decode(reader) {
			const out = {} as T;
			for (const [key, c] of entries) {
				out[key] = c.decode(reader) as T[typeof key];
			}
			return out;
		},
		measure(value) {
			let total = 0;
			for (const [key, c] of entries) {
				const v = value[key];
				total += (c as Types.InternalCodec<typeof v>).measure(v);
			}
			return total;
		},
	};

	return codec as unknown as Types.Codec<T>;
}
