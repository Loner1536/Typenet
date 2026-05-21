// Types
import * as Types from "../types";

// Codec
import { bool } from "./bool";

// Util
import { makeCodec, varLenSize, readVarLen, writeVarLen } from "../utils";

function isBoolCodec(element: Types.Codec<defined>): element is Types.Codec<boolean> {
	return element === (bool as unknown as Types.Codec<defined>);
}

/**
 * fixedArray<T>(element, length) — encodes/decodes a fixed-length array.
 * No delta encoding — all elements are always written in full.
 * For bool elements, uses bit-packing (8 bools per byte). No length prefix
 * is written since the length is known at definition time.
 *
 * Wire format (bool):  [ceil(length/8) packed bytes]
 * Wire format (other): [element0][element1]...[elementN]
 *
 * @example
 * t.fixedArray(t.u8, 16)
 * t.fixedArray(t.bool, 8) // packed into 1 byte
 */
export function fixedArray<T extends defined>(
	element: Types.Codec<T>,
	length: number,
): Types.Codec<T[]> {
	if (isBoolCodec(element)) {
		const maskBytes = math.ceil(length / 8);
		return makeCodec<T[]>({
			encode(buf, offset, value) {
				assert(
					value.size() === length,
					`[Net] fixedArray: expected ${length} elements, got ${value.size()}`,
				);
				let cursor = offset;
				for (let byteIdx = 0; byteIdx < maskBytes; byteIdx++) {
					let byte = 0;
					for (let bit = 0; bit < 8; bit++) {
						const i = byteIdx * 8 + bit;
						if (i < length && (value as unknown as boolean[])[i]) byte = byte | (1 << bit);
					}
					buffer.writeu8(buf, cursor, byte);
					cursor += 1;
				}
			},
			decode(reader) {
				const out: boolean[] = [];
				for (let byteIdx = 0; byteIdx < maskBytes; byteIdx++) {
					const byte = reader.readu8();
					for (let bit = 0; bit < 8; bit++) {
						const i = byteIdx * 8 + bit;
						if (i < length) out.push((byte & (1 << bit)) !== 0);
					}
				}
				return out as unknown as T[];
			},
			measure() {
				return maskBytes;
			},
		});
	}

	const el = element as unknown as Types.InternalCodec<T>;

	return makeCodec<T[]>({
		encode(buf, offset, value) {
			assert(
				value.size() === length,
				`[Net] fixedArray: expected ${length} elements, got ${value.size()}`,
			);
			let cursor = offset;
			for (const item of value) {
				el.encode(buf, cursor, item);
				cursor += el.measure(item);
			}
		},
		decode(reader) {
			const out: T[] = [];
			for (let i = 0; i < length; i++) out.push(el.decode(reader));
			return out;
		},
		measure(value) {
			let total = 0;
			for (const item of value) total += el.measure(item);
			return total;
		},
	});
}

/**
 * array<T>(element, maxLength?) — encodes/decodes a variable-length array.
 * No delta encoding — all elements are always written in full.
 * For bool elements, uses bit-packing (8 bools per byte).
 *
 * Wire format: [varlen count][element0][element1]...
 *
 * @example
 * t.array(t.u8)
 * t.array(t.struct({ x: t.u8, y: t.u8 }), 64)
 */
export function array<T extends defined>(
	element: Types.Codec<T>,
	maxLength?: number,
): Types.Codec<T[]> {
	const bounded = maxLength !== undefined;

	if (isBoolCodec(element)) {
		const inner = bitPackedArrayFull(maxLength);
		return makeCodec(inner) as unknown as Types.Codec<T[]>;
	}

	const el = element as unknown as Types.InternalCodec<T>;

	return makeCodec<T[]>({
		encode(buf, offset, value) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			const prefixSize = writeVarLen(buf, offset, value.size());
			let cursor = offset + prefixSize;
			for (const item of value) {
				el.encode(buf, cursor, item);
				cursor += el.measure(item);
			}
		},
		decode(reader) {
			const len = readVarLen(reader);
			if (bounded)
				assert(len <= maxLength!, `[Net] Incoming array exceeds maxLength of ${maxLength}`);
			const out: T[] = [];
			for (let i = 0; i < len; i++) out.push(el.decode(reader));
			return out;
		},
		measure(value) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			let total = varLenSize(value.size());
			for (const item of value) total += el.measure(item);
			return total;
		},
	});
}

function bitPackedArrayFull(maxLength?: number): Types.InternalCodec<boolean[]> {
	const bounded = maxLength !== undefined;
	return {
		encode(buf, offset, value) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			const count = value.size();
			const prefixSize = writeVarLen(buf, offset, count);
			let cursor = offset + prefixSize;
			for (let byteIdx = 0; byteIdx < math.ceil(count / 8); byteIdx++) {
				let byte = 0;
				for (let bit = 0; bit < 8; bit++) {
					const i = byteIdx * 8 + bit;
					if (i < count && value[i]) byte = byte | (1 << bit);
				}
				buffer.writeu8(buf, cursor, byte);
				cursor += 1;
			}
		},
		decode(reader) {
			const count = readVarLen(reader);
			if (bounded)
				assert(count <= maxLength!, `[Net] Incoming array exceeds maxLength of ${maxLength}`);
			const out: boolean[] = [];
			for (let byteIdx = 0; byteIdx < math.ceil(count / 8); byteIdx++) {
				const byte = reader.readu8();
				for (let bit = 0; bit < 8; bit++) {
					const i = byteIdx * 8 + bit;
					if (i < count) out.push((byte & (1 << bit)) !== 0);
				}
			}
			return out;
		},
		measure(value) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			const count = value.size();
			return varLenSize(count) + math.ceil(count / 8);
		},
	};
}

function bitPackedArrayDelta(maxLength?: number): Types.InternalCodec<boolean[]> {
	const bounded = maxLength !== undefined;
	return {
		encode(buf, offset, value, baseline) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			const count = value.size();

			if (baseline === undefined) {
				return bitPackedArrayFull(maxLength).encode(buf, offset, value);
			}

			const base = baseline as boolean[];
			const baseLen = base.size();
			const compareLen = math.max(count, baseLen);
			const maskBytes = math.ceil(compareLen / 8);
			const prefixSize = writeVarLen(buf, offset, count);

			for (let b = 0; b < maskBytes; b++) buffer.writeu8(buf, offset + prefixSize + b, 0);

			for (let i = 0; i < count; i++) {
				const v = value[i];
				const bv = i < baseLen ? base[i] : undefined;
				if (bv === undefined || v !== bv) {
					const byteIdx = math.floor(i / 8);
					const prev = buffer.readu8(buf, offset + prefixSize + byteIdx);
					buffer.writeu8(buf, offset + prefixSize + byteIdx, prev | (1 << (i % 8)));
				}
			}

			let cursor = offset + prefixSize + maskBytes;
			let valueByte = 0;
			let valueBit = 0;
			for (let i = 0; i < count; i++) {
				const v = value[i];
				const bv = i < baseLen ? base[i] : undefined;
				if (bv === undefined || v !== bv) {
					if (v) valueByte = valueByte | (1 << valueBit);
					valueBit++;
					if (valueBit === 8) {
						buffer.writeu8(buf, cursor, valueByte);
						cursor += 1;
						valueByte = 0;
						valueBit = 0;
					}
				}
			}
			if (valueBit > 0) buffer.writeu8(buf, cursor, valueByte);
		},

		decode(reader, baseline) {
			const count = readVarLen(reader);
			if (bounded)
				assert(count <= maxLength!, `[Net] Incoming array exceeds maxLength of ${maxLength}`);

			if (baseline === undefined) {
				const out: boolean[] = [];
				for (let byteIdx = 0; byteIdx < math.ceil(count / 8); byteIdx++) {
					const byte = reader.readu8();
					for (let bit = 0; bit < 8; bit++) {
						const i = byteIdx * 8 + bit;
						if (i < count) out.push((byte & (1 << bit)) !== 0);
					}
				}
				return out;
			}

			const base = baseline as boolean[];
			const baseLen = base.size();
			const compareLen = math.max(count, baseLen);
			const maskBytes = math.ceil(compareLen / 8);
			const masks: number[] = [];
			for (let b = 0; b < maskBytes; b++) masks.push(reader.readu8());

			let valueByte = 0;
			let valueBit = 8;
			const out: boolean[] = [];
			for (let i = 0; i < count; i++) {
				const changed = (masks[math.floor(i / 8)] & (1 << (i % 8))) !== 0;
				if (changed) {
					if (valueBit === 8) {
						valueByte = reader.readu8();
						valueBit = 0;
					}
					out.push((valueByte & (1 << valueBit)) !== 0);
					valueBit++;
				} else {
					out.push(i < baseLen ? base[i] : false);
				}
			}
			return out;
		},

		measure(value, baseline) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			const count = value.size();

			if (baseline === undefined) {
				return varLenSize(count) + math.ceil(count / 8);
			}

			const base = baseline as boolean[];
			const baseLen = base.size();
			const compareLen = math.max(count, baseLen);
			const maskBytes = math.ceil(compareLen / 8);
			let changedCount = 0;
			for (let i = 0; i < count; i++) {
				const bv = i < baseLen ? base[i] : undefined;
				if (bv === undefined || value[i] !== bv) changedCount++;
			}
			return varLenSize(count) + maskBytes + math.ceil(changedCount / 8);
		},
	};
}
