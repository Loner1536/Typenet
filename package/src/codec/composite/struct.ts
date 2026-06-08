//!optimize 2
//!native

// Package
import Object from "@rbxts/object-utils";

// Internal
import * as Type from "@type";

// Utility
import { splitBoolKeys, getBitmapBytes, packBools, unpackBools } from "@utility/bool-pack";

function struct<T extends Record<string, Type.Codec.External<unknown>>>(fields: T) {
    const internalFields = fields as unknown as Record<string, Type.Codec.Internal<unknown>>;
    const allKeys = (Object.keys(internalFields) as string[]).sort();
    const { dataKeys, boolKeys } = splitBoolKeys(internalFields, allKeys);
    const bitmapBytes = getBitmapBytes(boolKeys.size());
    const dataLen = dataKeys.size();
    const hasBools = boolKeys.size() > 0;

    const dataCodecs: Type.Codec.Internal<unknown>[] = [];
    const dataKeyArr: string[] = [];

    for (let i = 0; i < dataLen; i++) {
        dataKeyArr[i] = dataKeys[i];
        dataCodecs[i] = internalFields[dataKeys[i]];
    }

    let allDirect = dataLen > 0;
    let fixedSize = 0;

    for (let i = 0; i < dataLen; i++) {
        const c = dataCodecs[i];
        if (c._size !== undefined && c._directWrite !== undefined && c._directRead !== undefined) {
            fixedSize += c._size;
        } else {
            allDirect = false;
            break;
        }
    }

    const boolBytes = getBitmapBytes(boolKeys.size());
    const totalFixed = fixedSize + boolBytes;

    const defaultResult: Record<string, unknown> = {};
    for (let i = 0; i < allKeys.size(); i++) {
        defaultResult[allKeys[i]] = internalFields[allKeys[i]]._default;
    }

    if (allDirect) {
        const offsets: number[] = [];
        const directWrites: ((buf: buffer, off: number, value: unknown) => void)[] = [];
        const directReads: ((buf: buffer, off: number) => unknown)[] = [];

        let runningOffset = 0;
        for (let i = 0; i < dataLen; i++) {
            offsets[i] = runningOffset;
            directWrites[i] = dataCodecs[i]._directWrite!;
            directReads[i] = dataCodecs[i]._directRead!;
            runningOffset += dataCodecs[i]._size!;
        }

        const directWrite = (buf: buffer, off: number, value: unknown) => {
            const val = value as Record<string, unknown>;
            for (let i = 0; i < dataLen; i++) {
                directWrites[i](buf, off + offsets[i], val[dataKeyArr[i]]);
            }
            if (hasBools) {
                let bitmap = 0;
                for (let i = 0; i < boolKeys.size(); i++) {
                    if ((val as Record<string, unknown>)[boolKeys[i]] === true) {
                        bitmap = bit32.bor(bitmap, bit32.lshift(1, i));
                    }
                }

                if (boolBytes === 1) buffer.writeu8(buf, off + fixedSize, bitmap);
                else if (boolBytes === 2) buffer.writeu16(buf, off + fixedSize, bitmap);
                else buffer.writeu32(buf, off + fixedSize, bitmap);
            }
        };

        const directRead = (buf: buffer, off: number) => {
            const result: Record<string, unknown> = {};
            for (let i = 0; i < dataLen; i++) {
                result[dataKeyArr[i]] = directReads[i](buf, off + offsets[i]);
            }
            if (hasBools) {
                let bitmap: number;

                if (boolBytes === 1) bitmap = buffer.readu8(buf, off + fixedSize);
                else if (boolBytes === 2) bitmap = buffer.readu16(buf, off + fixedSize);
                else bitmap = buffer.readu32(buf, off + fixedSize);

                for (let i = 0; i < boolKeys.size(); i++) {
                    result[boolKeys[i]] = bit32.band(bitmap, bit32.lshift(1, i)) !== 0;
                }
            }
            return result;
        };

        return {
            write: (writer, value) => {
                writer.ensureSpace(totalFixed);
                directWrite(writer.buf, writer.offset, value);
                writer.offset += totalFixed;
            },
            read: (cursor) => {
                cursor.ensureRemaining(totalFixed);
                const result = directRead(cursor.buf, cursor.offset);
                cursor.offset += totalFixed;
                return result;
            },
            _directWrite: directWrite,
            _directRead: directRead,

            _default: defaultResult,

            _size: totalFixed,
        } as Type.Codec.Internal<Type.Codec.InferSchema<T>> as Type.Codec.External<
            Type.Codec.InferSchema<T>
        >;
    }

    return {
        write: (writer, value) => {
            const val = value as Record<string, unknown>;
            for (let i = 0; i < dataLen; i++) {
                dataCodecs[i].write(writer, val[dataKeyArr[i]]);
            }

            if (hasBools) packBools(writer, val, boolKeys, bitmapBytes);
        },
        read: (cursor) => {
            const result: Record<string, unknown> = {};
            for (let i = 0; i < dataLen; i++) {
                result[dataKeyArr[i]] = dataCodecs[i].read(cursor);
            }

            if (hasBools) unpackBools(cursor, result, boolKeys, bitmapBytes);

            return result;
        },
        _default: defaultResult,
    } as Type.Codec.Internal<Type.Codec.InferSchema<T>> as Type.Codec.External<
        Type.Codec.InferSchema<T>
    >;
}

export default struct;
