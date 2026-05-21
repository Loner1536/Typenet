// Codec
import * as Types from "../types";

// Utils
import { writeVarLen, readVarLen, varLenSize } from "../utils";

/**
 * map<K, V>(keyCodec, valueCodec, maxSize?) — encodes/decodes a Map<K, V>.
 * No delta encoding — all entries are always written in full.
 *
 * Wire format: [varlen count][key0][value0][key1][value1]...
 *
 * @example
 * t.map(t.u16, t.struct({ hp: t.u8 }))
 * t.map(t.string, t.u8, 64)
 */
export function map<K extends defined, V extends defined>(
	keyCodec: Types.Codec<K>,
	valueCodec: Types.Codec<V>,
	maxSize?: number,
): Types.Codec<Map<K, V>> {
	const bounded = maxSize !== undefined;
	const kc = keyCodec as unknown as Types.InternalCodec<K>;
	const vc = valueCodec as unknown as Types.InternalCodec<V>;

	const codec: Types.InternalCodec<Map<K, V>> = {
		encode(buf, offset, value) {
			if (bounded) assert(value.size() <= maxSize!, `[Net] map exceeds maxSize of ${maxSize}`);
			const count = value.size();
			let cursor = offset + writeVarLen(buf, offset, count);
			for (const [k, v] of value) {
				kc.encode(buf, cursor, k);
				cursor += kc.measure(k);
				vc.encode(buf, cursor, v);
				cursor += vc.measure(v);
			}
		},

		decode(reader) {
			const count = readVarLen(reader);
			if (bounded) assert(count <= maxSize!, `[Net] Incoming map exceeds maxSize of ${maxSize}`);
			const out = new Map<K, V>();
			for (let i = 0; i < count; i++) {
				const k = kc.decode(reader);
				const v = vc.decode(reader);
				out.set(k, v);
			}
			return out;
		},

		measure(value) {
			if (bounded) assert(value.size() <= maxSize!, `[Net] map exceeds maxSize of ${maxSize}`);
			let total = varLenSize(value.size());
			for (const [k, v] of value) {
				total += kc.measure(k) + vc.measure(v);
			}
			return total;
		},
	};

	return codec as unknown as Types.Codec<Map<K, V>>;
}
