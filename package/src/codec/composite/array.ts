//!optimize 2
//!native

// Internal
import Constant from "@constant";
import * as Type from "@type";

// Security
import Report from "@security/report";

// Utility
import { packBoolArray, unpackBoolArray } from "@utility/bool-pack";

function array<T>(codec: Type.Codec.External<T>) {
    const internalCodec = codec as Type.Codec.Internal<T>;
    const isBool = typeOf(internalCodec._default) === "boolean";
    const elemSize = internalCodec._size;

    const directWrite = internalCodec._directWrite;
    const directRead = internalCodec._directRead;
    const isDirect =
        elemSize !== undefined && directWrite !== undefined && directRead !== undefined;

    return {
        write: (writer, value) => {
            const len = value.size();
            if (len > Constant.MAX_ARRAY_LENGTH) {
                Report.log("warn", "ARRAY_TOO_LARGE", {
                    length: len,
                    max: Constant.MAX_ARRAY_LENGTH,
                });
            }
            writer.varint(len);

            if (isBool) {
                packBoolArray(writer, value as boolean[], len);
            } else if (isDirect) {
                const payloadBytes = len * elemSize;
                writer.ensureSpace(payloadBytes);

                const buf = writer.buf;
                let off = writer.offset;
                for (let i = 0; i < len; i++) {
                    directWrite(buf, off, value[i]);
                    off += elemSize;
                }
                writer.offset += payloadBytes;
            } else {
                for (let i = 0; i < len; i++) {
                    internalCodec.write(writer, value[i]);
                }
            }
        },
        read: (cursor) => {
            const len = cursor.varint();
            if (len > Constant.MAX_ARRAY_LENGTH) {
                Report.log("warn", "ARRAY_TOO_LARGE", { len, max: Constant.MAX_ARRAY_LENGTH });
            }

            if (isBool) {
                return unpackBoolArray(cursor, len) as unknown as T[];
            }

            if (isDirect) {
                const payloadBytes = len * elemSize;
                cursor.ensureRemaining(payloadBytes);

                const result = new Array<T>(len);
                const buf = cursor.buf;
                let off = cursor.offset;

                for (let i = 0; i < len; i++) {
                    result[i] = directRead(buf, off) as T;
                    off += elemSize;
                }
                cursor.offset += payloadBytes;
                return result;
            }

            const result = new Array<T>(len);
            for (let i = 0; i < len; i++) {
                result[i] = internalCodec.read(cursor);
            }
            return result;
        },
        _default: [] as T[],
    } as Type.Codec.Internal<T[]> as Type.Codec.External<T[]>;
}

export default array;
