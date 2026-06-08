//!optimize 2
//!native

// Package
import Object from "@rbxts/object-utils";

// Internal
import { IS_SERVER } from "@environment";
import Constant from "@constant";
import * as Type from "@type";

// Transport
import Snapshot from "@transport/snapshot";

// Security
import Report from "@security/report";

// Utility
import { splitBoolKeys, getBitmapBytes, packBools, unpackBools } from "@utility/bool-pack";

const FLAG_UNCHANGED = 0;
const FLAG_FULL = 1;
const FLAG_MULTI = 2;
const SINGLE_FIELD_OFFSET = 3;

function deltaStruct<T extends Record<string, Type.Codec.External<unknown>>>(fields: T) {
    const id = Snapshot.allocId();

    const internalFields = fields as unknown as Record<string, Type.Codec.Internal<unknown>>;

    const allKeys = (Object.keys(internalFields) as string[]).sort();
    const { dataKeys, boolKeys } = splitBoolKeys(internalFields, allKeys);

    const fieldCount = allKeys.size();
    const bitmapBytes = getBitmapBytes(boolKeys.size());
    const deltaBitmapBytes = fieldCount <= 8 ? 1 : fieldCount <= 16 ? 2 : 4;

    function writeFull(writer: Type.Writer, value: Record<string, unknown>) {
        dataKeys.forEach((key) => internalFields[key].write(writer, value[key]));
        if (boolKeys.size() > 0) packBools(writer, value, boolKeys, bitmapBytes);
    }

    function readFull(cursor: Type.Cursor): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        dataKeys.forEach((key) => {
            result[key] = internalFields[key].read(cursor);
        });
        if (boolKeys.size() > 0) unpackBools(cursor, result, boolKeys, bitmapBytes);

        return result;
    }

    function buildDefault(): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        allKeys.forEach((key) => {
            result[key] = internalFields[key]._default;
        });

        return result;
    }

    function copyCache(cached: Record<string, unknown>): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        allKeys.forEach((key) => {
            result[key] = cached[key];
        });

        return result;
    }

    function readDeltaBitmap(cursor: Type.Cursor): number {
        if (deltaBitmapBytes === 1) return cursor.u8();
        if (deltaBitmapBytes === 2) return cursor.u16();

        return cursor.u32();
    }

    function writeDeltaBitmap(writer: Type.Writer, bitmap: number) {
        if (deltaBitmapBytes === 1) writer.u8(bitmap);
        else if (deltaBitmapBytes === 2) writer.u16(bitmap);
        else writer.u32(bitmap);
    }

    function readField(cursor: Type.Cursor, cached: Record<string, unknown>, key: string) {
        if (boolKeys.includes(key)) {
            unpackBools(cursor, cached, [key], 1);
        } else {
            cached[key] = internalFields[key].read(cursor);
        }
    }

    function writeField(writer: Type.Writer, val: Record<string, unknown>, key: string) {
        if (boolKeys.includes(key)) {
            packBools(writer, val, [key], 1);
        } else {
            internalFields[key].write(writer, val[key]);
        }
    }

    return {
        write: (writer, value) => {
            const player = IS_SERVER ? Snapshot.getCurrentPlayer() : undefined;
            const cached = Snapshot.getCache(id, player) as Record<string, unknown> | undefined;
            const val = value as Record<string, unknown>;

            if (cached === undefined) {
                writer.u8(FLAG_FULL);
                writeFull(writer, val);

                const cache: Record<string, unknown> = {};
                allKeys.forEach((key) => {
                    cache[key] = val[key];
                });
                Snapshot.setCache(id, cache, player);

                return;
            }

            const dirtyIndices: number[] = [];
            allKeys.forEach((key, i) => {
                if (cached[key] !== val[key]) dirtyIndices.push(i);
            });

            if (dirtyIndices.size() === 0) {
                writer.u8(FLAG_UNCHANGED);
                return;
            }

            if (dirtyIndices.size() === 1) {
                const i = dirtyIndices[0];
                const key = allKeys[i];
                writer.u8(SINGLE_FIELD_OFFSET + i);
                writeField(writer, val, key);
                cached[key] = val[key];
                return;
            }

            writer.u8(FLAG_MULTI);

            let bitmap = 0;
            dirtyIndices.forEach((i) => {
                bitmap = bit32.bor(bitmap, bit32.lshift(1, i));
            });

            writeDeltaBitmap(writer, bitmap);

            dirtyIndices.forEach((i) => {
                const key = allKeys[i];
                writeField(writer, val, key);
                cached[key] = val[key];
            });
        },

        read: (cursor) => {
            const player = cursor.getPlayer();
            const flag = cursor.u8();

            if (flag === FLAG_UNCHANGED) {
                const cached = Snapshot.getCache(id, player) as Record<string, unknown> | undefined;
                if (cached === undefined) {
                    Report.log("warn", "DELTA_STRUCT_UNCHANGED_NO_CACHE", { id });
                    return buildDefault();
                }
                return copyCache(cached) as Type.Codec.InferSchema<T>;
            }

            if (flag === FLAG_FULL) {
                const result = readFull(cursor);
                Snapshot.setCache(id, result, player);
                return copyCache(result) as Type.Codec.InferSchema<T>;
            }

            if (flag === FLAG_MULTI) {
                const cached = Snapshot.getCache(id, player) as Record<string, unknown> | undefined;
                if (cached === undefined) {
                    Report.log("warn", "DELTA_STRUCT_MULTI_NO_CACHE", { id });
                    return buildDefault();
                }
                const bitmap = readDeltaBitmap(cursor);
                allKeys.forEach((key, i) => {
                    if (bit32.band(bitmap, bit32.lshift(1, i)) !== 0) {
                        readField(cursor, cached, key);
                    }
                });
                return copyCache(cached) as Type.Codec.InferSchema<T>;
            }

            const fieldIndex = flag - SINGLE_FIELD_OFFSET;
            if (fieldIndex >= fieldCount) {
                Report.log("warn", "DELTA_STRUCT_INVALID_FLAG", { flag, fieldCount });
                return buildDefault();
            }

            const cached = Snapshot.getCache(id, player) as Record<string, unknown> | undefined;
            if (cached === undefined) {
                Report.log("warn", "DELTA_STRUCT_SINGLE_NO_CACHE", { id });
                return buildDefault();
            }

            readField(cursor, cached, allKeys[fieldIndex]);
            return copyCache(cached) as Type.Codec.InferSchema<T>;
        },
        _default: buildDefault() as Type.Codec.InferSchema<T>,

        _delta: true,
    } as Type.Codec.Internal<Type.Codec.InferSchema<T>> as Type.Codec.External<
        Type.Codec.InferSchema<T>
    >;
}

export default deltaStruct;
