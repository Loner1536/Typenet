// Package
import Object from "@rbxts/object-utils";

// Codec
import * as Types from "../types";

type StructSchema<T> = { [K in keyof T]: Types.Codec<T[K]> };

/**
 * struct<T>(schema) — encodes/decodes a plain object with fixed named fields.
 * Delta encoding: when a `baseline` is provided, writes a changed-bitmask
 * (1 bit per field, packed into ceil(fields/8) bytes) followed by only the
 * fields whose values differ from the baseline. Unchanged fields are skipped
 * entirely on the wire and reconstructed from the baseline on decode.
 *
 * Wire format (no baseline):   [field0][field1]...[fieldN]
 * Wire format (with baseline): [ceil(fields/8) bitmask][changed field values...]
 *
 * @example
 * // 6-field entity, nothing changed = 1 byte vs 6 bytes without delta.
 * const Entity = t.struct({ x: t.u8, y: t.u8, z: t.u8, orientation: t.u8, id: t.u8, anim: t.u8 });
 */
export function struct<T extends object>(schema: StructSchema<T>): Types.Codec<T> {
	const entries = Object.entries(schema) as [keyof T, Types.InternalCodec<unknown>][];
	const fieldCount = entries.size();
	const maskBytes = math.ceil(fieldCount / 8);

	const codec: Types.InternalCodec<T> = {
		encode(buf, offset, value, baseline) {
			if (baseline === undefined) {
				let cursor = offset;
				for (const [key, c] of entries) {
					const v = value[key];
					(c as Types.InternalCodec<typeof v>).encode(buf, cursor, v);
					cursor += (c as Types.InternalCodec<typeof v>).measure(v);
				}
				return;
			}

			for (let b = 0; b < maskBytes; b++) buffer.writeu8(buf, offset + b, 0);

			let cursor = offset + maskBytes;
			for (let i = 0; i < fieldCount; i++) {
				const [key, c] = entries[i];
				const v = value[key];
				const base = (baseline as T)[key];
				if (v !== base) {
					const byteIdx = math.floor(i / 8);
					const prev = buffer.readu8(buf, offset + byteIdx);
					buffer.writeu8(buf, offset + byteIdx, prev | (1 << (i % 8)));
					(c as Types.InternalCodec<typeof v>).encode(buf, cursor, v, base as typeof v);
					cursor += (c as Types.InternalCodec<typeof v>).measure(v, base as typeof v);
				}
			}
		},

		decode(reader, baseline) {
			if (baseline === undefined) {
				const out = {} as T;
				for (const [key, c] of entries) {
					out[key] = c.decode(reader) as T[typeof key];
				}
				return out;
			}

			const masks: number[] = [];
			for (let b = 0; b < maskBytes; b++) masks.push(reader.readu8());

			const out = {} as T;
			for (let i = 0; i < fieldCount; i++) {
				const [key, c] = entries[i];
				const changed = (masks[math.floor(i / 8)] & (1 << (i % 8))) !== 0;
				if (changed) {
					const base = (baseline as T)[key];
					out[key] = c.decode(reader, base as never) as T[typeof key];
				} else {
					out[key] = (baseline as T)[key];
				}
			}
			return out;
		},

		measure(value, baseline) {
			if (baseline === undefined) {
				let total = 0;
				for (const [key, c] of entries) {
					const v = value[key];
					total += (c as Types.InternalCodec<typeof v>).measure(v);
				}
				return total;
			}

			let total = maskBytes;
			for (const [key, c] of entries) {
				const v = value[key];
				const base = (baseline as T)[key];
				if (v !== base) total += (c as Types.InternalCodec<typeof v>).measure(v, base as typeof v);
			}
			return total;
		},
	};

	return codec as unknown as Types.Codec<T>;
}
