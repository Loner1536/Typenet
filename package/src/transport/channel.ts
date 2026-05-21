const INITIAL_CAPACITY = 512;

/**
 * A write buffer that accumulates framed remote payloads and flushes them as a single buffer.
 *
 * Frame layout: [remote_id: u8][payload_size: varint (1–2 bytes)][payload bytes...]
 */
export type Channel = {
	/** Appends a framed payload for the given remote ID to the channel. */
	write(remoteId: number, payload: buffer): void;

	/**
	 * Returns the accumulated buffer and resets the channel.
	 * Returns `undefined` if nothing has been written since the last flush.
	 */
	flush(): buffer | undefined;

	/** Returns the number of bytes currently written to the channel. */
	byteLength(): number;
};

/**
 * Writes a payload length as a varint (1 byte if < 128, 2 bytes otherwise).
 * Returns the number of bytes written.
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
 * Creates a new channel starting with a 512-byte buffer that doubles in capacity as needed.
 *
 * @example
 * const channel = createChannel();
 * channel.write(remoteId, payload);
 * const buf = channel.flush(); // send buf over the wire
 */
export function createChannel(): Channel {
	let buf = buffer.create(INITIAL_CAPACITY);
	let cursor = 0;

	function ensure(needed: number): void {
		const current = buffer.len(buf);
		if (cursor + needed <= current) return;
		let n = current;
		while (n < cursor + needed) n *= 2;
		const grown = buffer.create(n);
		buffer.copy(grown, 0, buf, 0, cursor);
		buf = grown;
	}

	return {
		write(remoteId: number, payload: buffer): void {
			const payloadSize = buffer.len(payload);
			const sizeBytes = payloadSize < 128 ? 1 : 2;
			ensure(1 + sizeBytes + payloadSize);

			buffer.writeu8(buf, cursor, remoteId);
			cursor += 1;

			cursor += writeVarLen(buf, cursor, payloadSize);

			buffer.copy(buf, cursor, payload, 0, payloadSize);
			cursor += payloadSize;
		},

		flush(): buffer | undefined {
			if (cursor === 0) return undefined;
			const out = buffer.create(cursor);
			buffer.copy(out, 0, buf, 0, cursor);
			cursor = 0;
			return out;
		},

		byteLength(): number {
			return cursor;
		},
	};
}
