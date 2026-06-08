//!optimize 2
//!native

// Internal
import { IS_SERVER } from "@environment";
import * as Type from "@type";

// Transport
import Snapshot from "@transport/snapshot";

// Binary
import Writer from "@binary/writer";

// Security
import Report from "@security/report";

const FLAG_UNCHANGED = 0;
const FLAG_FULL = 1;
const FLAG_DIFF = 2;

interface CachedElement<T> {
    value: T;
    bytes: buffer;
}

function buffersEqual(a: buffer, b: buffer): boolean {
    const len = buffer.len(a);
    if (len !== buffer.len(b)) return false;
    for (let i = 0; i < len; i++) {
        if (buffer.readu8(a, i) !== buffer.readu8(b, i)) return false;
    }
    return true;
}

function serializeElement<T>(
    scratch: Type.Writer,
    codec: Type.Codec.Internal<T>,
    value: T,
): buffer {
    scratch.reset();
    codec.write(scratch, value);
    return scratch.copyOut(0, scratch.used());
}

function deltaArray<T>(codec: Type.Codec.External<T>) {
    const id = Snapshot.allocId();
    const internalCodec = codec as unknown as Type.Codec.Internal<T>;
    const scratch = new Writer();

    return {
        write: (writer, value) => {
            const player = IS_SERVER ? Snapshot.getCurrentPlayer() : undefined;
            const cached = Snapshot.getCache(id, player) as CachedElement<T>[] | undefined;
            const len = value.size();

            if (cached === undefined || len !== cached.size()) {
                writer.u8(FLAG_FULL);
                writer.varint(len);

                const newCache: CachedElement<T>[] = [];
                for (let i = 0; i < len; i++) {
                    const bytes = serializeElement(scratch, internalCodec, value[i]);
                    newCache[i] = { value: value[i], bytes };
                    writer.bytes(bytes, 0, buffer.len(bytes));
                }
                Snapshot.setCache(id, newCache, player);
                return;
            }

            const serialized: buffer[] = [];
            const dirty: number[] = [];
            for (let i = 0; i < len; i++) {
                const bytes = serializeElement(scratch, internalCodec, value[i]);
                serialized[i] = bytes;
                if (!buffersEqual(bytes, cached[i].bytes)) dirty.push(i);
            }

            if (dirty.size() === 0) {
                writer.u8(FLAG_UNCHANGED);
                return;
            }

            writer.u8(FLAG_DIFF);
            writer.varint(dirty.size());
            const dirtyLen = dirty.size();
            for (let d = 0; d < dirtyLen; d++) {
                const i = dirty[d];
                writer.varint(i);
                writer.bytes(serialized[i], 0, buffer.len(serialized[i]));
                cached[i] = { value: value[i], bytes: serialized[i] };
            }
        },

        read: (cursor) => {
            const player = cursor.getPlayer();
            const flag = cursor.u8();

            if (flag === FLAG_UNCHANGED) {
                const cached = Snapshot.getCache(id, player) as CachedElement<T>[] | undefined;
                if (cached === undefined) {
                    Report.log("warn", "DELTA_ARRAY_UNCHANGED_NO_CACHE", { id });
                    return [];
                }
                const result: T[] = [];
                const clen = cached.size();
                for (let i = 0; i < clen; i++) result[i] = cached[i].value;
                return result;
            }

            if (flag === FLAG_FULL) {
                const len = cursor.varint();
                const newCache: CachedElement<T>[] = [];
                const result: T[] = [];

                for (let i = 0; i < len; i++) {
                    const start = cursor.offset;
                    const value = internalCodec.read(cursor);
                    const bytes = cursor.copyRange(start, cursor.offset);
                    newCache[i] = { value, bytes };
                    result[i] = value;
                }
                Snapshot.setCache(id, newCache, player);
                return result;
            }

            const cachedRaw = Snapshot.getCache(id, player) as CachedElement<T>[] | undefined;
            if (cachedRaw === undefined) {
				Report.log("warn", "DELTA_ARRAY_DIFF_NO_CACHE", { id });
				return [];
			}
			const cached = cachedRaw as CachedElement<T>[];

			const count = cursor.varint();
			for (let i = 0; i < count; i++) {
				const index = cursor.varint();
				const start = cursor.offset;
				const value = internalCodec.read(cursor);
				const bytes = cursor.copyRange(start, cursor.offset);
				cached[index] = { value, bytes };
			}

			Snapshot.setCache(id, cached, player);

			const result: T[] = [];
			const clen = cached.size();
			for (let i = 0; i < clen; i++) result[i] = cached[i].value;
			return result;
		},

		_delta: true,
		_default: [] as T[],
	} as Type.Codec.Internal<T[]> as Type.Codec.External<T[]>;
}

export default deltaArray;
