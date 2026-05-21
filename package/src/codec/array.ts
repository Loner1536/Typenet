// Transport
import { Reader } from "../transport/reader";

// Types
import * as Types from "../types";

// Codec
import { bool } from "./bool";

/** Wraps a BufferCodec as the public Codec type, hiding encode/decode/measure. */
function makeCodec<T>(codec: Types.InternalCodec<T>): Types.Codec<T> {
	return codec as unknown as Types.Codec<T>;
}

/** Returns true if the element codec is the bool singleton, enabling bit-packing. */
function isBoolCodec(element: Types.Codec<defined>): element is Types.Codec<boolean> {
	return element === (bool as unknown as Types.Codec<defined>);
}

/**
 * Writes a variable-length integer (1 or 2 bytes).
 * Values < 128 fit in 1 byte. Values 128–16383 use 2 bytes with the high bit as a continuation flag.
 * @returns number of bytes written
 */
function writeVarLen(buf: buffer, offset: number, len: number): number {
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
function readVarLen(reader: Reader): number {
	const first = reader.readu8();
	if ((first & 0x80) === 0) return first;
	return (first & 0x7f) | (reader.readu8() << 7);
}

/** Returns how many bytes writeVarLen will use for `len`. */
function varLenSize(len: number): number {
	return len < 128 ? 1 : 2;
}

/**
 * Boolean-specific array codec. Packs 8 bools per byte instead of 1 byte each.
 * With delta: writes a changed-mask then a packed bitfield of only the new values for changed slots.
 *
 * Wire format (full):  [varlen count][ceil(count/8) packed bytes]
 * Wire format (delta): [varlen count][ceil(compareLen/8) changed-mask][ceil(changedCount/8) value bits]
 */
function bitPackedArray(maxLength?: number): Types.InternalCodec<boolean[]> {
	const bounded = maxLength !== undefined;

	return {
		encode(buf, offset, value, baseline) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			const count = value.size();

			if (baseline !== undefined) {
				const base = baseline as boolean[];
				const baseLen = base.size();
				const compareLen = math.max(count, baseLen);
				const maskBytes = math.ceil(compareLen / 8);
				const prefixSize = writeVarLen(buf, offset, count);

				// Write changed-mask
				for (let b = 0; b < maskBytes; b++) buffer.writeu8(buf, offset + prefixSize + b, 0);

				for (let i = 0; i < count; i++) {
					const v = value[i];
					const bv = i < baseLen ? base[i] : undefined;
					if (bv === undefined || v !== bv) {
						const byteIdx = math.floor(i / 8);
						const bitIdx = i % 8;
						const prev = buffer.readu8(buf, offset + prefixSize + byteIdx);
						buffer.writeu8(buf, offset + prefixSize + byteIdx, prev | (1 << bitIdx));
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
				return;
			}

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

		decode(reader, baseline) {
			const count = readVarLen(reader);
			if (bounded)
				assert(count <= maxLength!, `[Net] Incoming array exceeds maxLength of ${maxLength}`);

			if (baseline !== undefined) {
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
					const byteIdx = math.floor(i / 8);
					const bitIdx = i % 8;
					const changed = (masks[byteIdx] & (1 << bitIdx)) !== 0;
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
			}

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

		measure(value, baseline) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);
			const count = value.size();

			if (baseline !== undefined) {
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
			}

			return varLenSize(count) + math.ceil(count / 8);
		},
	};
}

/**
 * Fixed-length array codec. No length prefix is written since the length is known at definition time.
 * For bool elements, uses bit-packing. For other elements, supports delta encoding via a changed-mask.
 *
 * Wire format (full):  [element0][element1]...[elementN]
 * Wire format (delta): [ceil(length/8) changed-mask][changed elements only]
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

	const changedMaskBytes = math.ceil(length / 8);

	const el = element as unknown as Types.InternalCodec<T>;

	return makeCodec<T[]>({
		encode(buf, offset, value, baseline) {
			assert(
				value.size() === length,
				`[Net] fixedArray: expected ${length} elements, got ${value.size()}`,
			);

			if (baseline === undefined) {
				let cursor = offset;
				for (const item of value) {
					el.encode(buf, cursor, item);
					cursor += el.measure(item);
				}
				return;
			}

			for (let b = 0; b < changedMaskBytes; b++) buffer.writeu8(buf, offset + b, 0);
			let cursor = offset + changedMaskBytes;
			for (let i = 0; i < length; i++) {
				const v = value[i];
				const base = (baseline as T[])[i];
				if (v !== base) {
					const byteIdx = math.floor(i / 8);
					const bitIdx = i % 8;
					const prev = buffer.readu8(buf, offset + byteIdx);
					buffer.writeu8(buf, offset + byteIdx, prev | (1 << bitIdx));
					el.encode(buf, cursor, v, base);
					cursor += el.measure(v, base);
				}
			}
		},
		decode(reader, baseline) {
			if (baseline === undefined) {
				const out: T[] = [];
				for (let i = 0; i < length; i++) out.push(el.decode(reader));
				return out;
			}

			const masks: number[] = [];
			for (let b = 0; b < changedMaskBytes; b++) masks.push(reader.readu8());

			const out: T[] = [];
			for (let i = 0; i < length; i++) {
				const byteIdx = math.floor(i / 8);
				const bitIdx = i % 8;
				if ((masks[byteIdx] & (1 << bitIdx)) !== 0) {
					out.push(el.decode(reader, (baseline as T[])[i]));
				} else {
					out.push((baseline as T[])[i]);
				}
			}
			return out;
		},
		measure(value, baseline) {
			if (baseline === undefined) {
				let total = 0;
				for (const item of value) total += el.measure(item);
				return total;
			}
			let total = changedMaskBytes;
			for (let i = 0; i < length; i++) {
				const v = value[i];
				const base = (baseline as T[])[i];
				if (v !== base) total += el.measure(v, base);
			}
			return total;
		},
	});
}

/**
 * Variable-length array codec. Writes a varlen count prefix followed by elements.
 * For bool elements, delegates to bitPackedArray. For other elements, supports delta encoding.
 *
 * Wire format (full):  [varlen count][element0][element1]...
 * Wire format (delta): [varlen count][ceil(compareLen/8) changed-mask][changed elements only]
 */
export function array<T extends defined>(
	element: Types.Codec<T>,
	maxLength?: number,
): Types.Codec<T[]> {
	const bounded = maxLength !== undefined;

	if (isBoolCodec(element)) {
		return makeCodec(bitPackedArray(maxLength)) as unknown as Types.Codec<T[]>;
	}

	const el = element as unknown as Types.InternalCodec<T>;

	return makeCodec<T[]>({
		encode(buf, offset, value, baseline) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);

			if (baseline === undefined) {
				const prefixSize = writeVarLen(buf, offset, value.size());
				let cursor = offset + prefixSize;
				for (const item of value) {
					el.encode(buf, cursor, item);
					cursor += el.measure(item);
				}
				return;
			}

			const newLen = value.size();
			const baseLen = (baseline as T[]).size();
			const compareLen = math.max(newLen, baseLen);
			const maskBytes = math.ceil(compareLen / 8);
			const prefixSize = writeVarLen(buf, offset, newLen);

			for (let b = 0; b < maskBytes; b++) buffer.writeu8(buf, offset + prefixSize + b, 0);
			let cursor = offset + prefixSize + maskBytes;
			for (let i = 0; i < newLen; i++) {
				const v = value[i];
				const base = i < baseLen ? (baseline as T[])[i] : undefined;
				const changed = base === undefined || v !== base;
				if (changed) {
					const byteIdx = math.floor(i / 8);
					const bitIdx = i % 8;
					const prev = buffer.readu8(buf, offset + prefixSize + byteIdx);
					buffer.writeu8(buf, offset + prefixSize + byteIdx, prev | (1 << bitIdx));
					el.encode(buf, cursor, v, base);
					cursor += el.measure(v, base);
				}
			}
		},

		decode(reader, baseline) {
			const len = readVarLen(reader);
			if (bounded)
				assert(len <= maxLength!, `[Net] Incoming array exceeds maxLength of ${maxLength}`);

			if (baseline === undefined) {
				const out: T[] = [];
				for (let i = 0; i < len; i++) out.push(el.decode(reader));
				return out;
			}

			const baseLen = (baseline as T[]).size();
			const compareLen = math.max(len, baseLen);
			const maskBytes = math.ceil(compareLen / 8);
			const masks: number[] = [];
			for (let b = 0; b < maskBytes; b++) masks.push(reader.readu8());

			const out: T[] = [];
			for (let i = 0; i < len; i++) {
				const byteIdx = math.floor(i / 8);
				const bitIdx = i % 8;
				const changed = (masks[byteIdx] & (1 << bitIdx)) !== 0;
				if (changed) {
					const base = i < baseLen ? (baseline as T[])[i] : undefined;
					out.push(el.decode(reader, base));
				} else {
					out.push((baseline as T[])[i]);
				}
			}
			return out;
		},

		measure(value, baseline) {
			if (bounded)
				assert(value.size() <= maxLength!, `[Net] array exceeds maxLength of ${maxLength}`);

			if (baseline === undefined) {
				let total = varLenSize(value.size());
				for (const item of value) total += el.measure(item);
				return total;
			}

			const newLen = value.size();
			const baseLen = (baseline as T[]).size();
			const compareLen = math.max(newLen, baseLen);
			const maskBytes = math.ceil(compareLen / 8);
			let total = varLenSize(newLen) + maskBytes;
			for (let i = 0; i < newLen; i++) {
				const v = value[i];
				const base = i < baseLen ? (baseline as T[])[i] : undefined;
				if (base === undefined || v !== base) total += el.measure(v, base);
			}
			return total;
		},
	});
}
