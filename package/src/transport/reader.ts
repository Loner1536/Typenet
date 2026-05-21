/**
 * Creates a stateful cursor over a buffer for sequential typed reads.
 * Throws on any read that would exceed the buffer bounds.
 *
 * @example
 * const reader = createReader(payload);
 * const id = reader.readu16();
 * const name = reader.readbytes(id);
 */
export function createReader(buf: buffer) {
	let pos = 0;
	const len = buffer.len(buf);

	function checkBounds(needed: number, label: string): void {
		assert(pos + needed <= len, `[Net/reader] Buffer underrun reading ${label}`);
	}

	return {
		/** Reads a u8 and advances the cursor by 1 byte. */
		readu8(): number {
			checkBounds(1, "u8");
			return buffer.readu8(buf, (pos += 1) - 1);
		},

		/** Reads a u16 and advances the cursor by 2 bytes. */
		readu16(): number {
			checkBounds(2, "u16");
			return buffer.readu16(buf, (pos += 2) - 2);
		},

		/** Reads a u32 and advances the cursor by 4 bytes. */
		readu32(): number {
			checkBounds(4, "u32");
			return buffer.readu32(buf, (pos += 4) - 4);
		},

		/** Reads an i8 and advances the cursor by 1 byte. */
		readi8(): number {
			checkBounds(1, "i8");
			return buffer.readi8(buf, (pos += 1) - 1);
		},

		/** Reads an i16 and advances the cursor by 2 bytes. */
		readi16(): number {
			checkBounds(2, "i16");
			return buffer.readi16(buf, (pos += 2) - 2);
		},

		/** Reads an i32 and advances the cursor by 4 bytes. */
		readi32(): number {
			checkBounds(4, "i32");
			return buffer.readi32(buf, (pos += 4) - 4);
		},

		/** Reads an f32 and advances the cursor by 4 bytes. */
		readf32(): number {
			checkBounds(4, "f32");
			return buffer.readf32(buf, (pos += 4) - 4);
		},

		/** Reads an f64 and advances the cursor by 8 bytes. */
		readf64(): number {
			checkBounds(8, "f64");
			return buffer.readf64(buf, (pos += 8) - 8);
		},

		/** Reads a u8 and returns it as a boolean (`1` → `true`). Advances the cursor by 1 byte. */
		readbool(): boolean {
			checkBounds(1, "bool");
			return buffer.readu8(buf, (pos += 1) - 1) === 1;
		},

		/** Reads a u16-prefixed UTF-8 string and advances the cursor past it. */
		readstring(): string {
			checkBounds(2, "string length");
			const byteLen = buffer.readu16(buf, (pos += 2) - 2);
			checkBounds(byteLen, "string bytes");
			return buffer.readstring(buf, (pos += byteLen) - byteLen, byteLen);
		},

		/** Reads exactly `byteLen` bytes as a string and advances the cursor past them. */
		readbytes(byteLen: number): string {
			checkBounds(byteLen, "bytes");
			return buffer.readstring(buf, (pos += byteLen) - byteLen, byteLen);
		},

		/** Returns the current cursor position. */
		cursor(): number {
			return pos;
		},

		/** Returns the number of bytes left to read. */
		remaining(): number {
			return len - pos;
		},
	};
}

export type Reader = ReturnType<typeof createReader>;
