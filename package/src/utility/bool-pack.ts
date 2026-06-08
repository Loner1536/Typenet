//!optimize 2
//!native

// Internal
import * as Type from "@type";

export function packBoolsKeyed(
    writer: Type.Writer,
    value: Record<string, unknown>,
    boolKeys: string[],
    bitmapBytes: number,
) {
    let bitmap = 0;
    const len = boolKeys.size();
    for (let i = 0; i < len; i++) {
        if (value[boolKeys[i]] === true) {
            bitmap = bit32.bor(bitmap, bit32.lshift(1, i));
        }
    }
    if (bitmapBytes === 1) writer.u8(bitmap);
    else if (bitmapBytes === 2) writer.u16(bitmap);
    else writer.u32(bitmap);
}

export function unpackBoolsKeyed(
    cursor: Type.Cursor,
    result: Record<string, unknown>,
    boolKeys: string[],
    bitmapBytes: number,
) {
    let bitmap: number;
    if (bitmapBytes === 1) bitmap = cursor.u8();
    else if (bitmapBytes === 2) bitmap = cursor.u16();
    else bitmap = cursor.u32();

    const len = boolKeys.size();
    for (let i = 0; i < len; i++) {
        result[boolKeys[i]] = bit32.band(bitmap, bit32.lshift(1, i)) !== 0;
    }
}

export function packBoolArray(writer: Type.Writer, value: boolean[], len: number) {
    const byteCount = math.ceil(len / 8);
    writer.ensureSpace(byteCount);
    const buf = writer.buf;
    let off = writer.offset;
    for (let i = 0; i < len; i += 8) {
        let byte = 0;
        for (let b = 0; b < 8 && i + b < len; b++) {
            if (value[i + b]) byte = bit32.bor(byte, bit32.lshift(1, b));
        }
        buffer.writeu8(buf, off, byte);
        off += 1;
    }
    writer.offset += byteCount;
}

export function unpackBoolArray(cursor: Type.Cursor, len: number): boolean[] {
    const result: boolean[] = [];
    for (let i = 0; i < len; i += 8) {
        const byte = cursor.u8();
        for (let b = 0; b < 8 && i + b < len; b++) {
            result[i + b] = bit32.band(byte, bit32.lshift(1, b)) !== 0;
        }
    }
    return result;
}

export function getBitmapBytes(boolCount: number): number {
    return boolCount === 0 ? 0 : boolCount <= 8 ? 1 : boolCount <= 16 ? 2 : 4;
}

export function splitBoolKeys(
    internalFields: Record<string, Type.Codec.Internal<unknown>>,
    allKeys: string[],
): { dataKeys: string[]; boolKeys: string[] } {
    const dataKeys: string[] = [];
    const boolKeys: string[] = [];

    allKeys.forEach((key) => {
        if (typeOf(internalFields[key]._default) === "boolean") {
            boolKeys.push(key);
        } else {
            dataKeys.push(key);
        }
    });

    return { dataKeys, boolKeys };
}

export const packBools = packBoolsKeyed;
export const unpackBools = unpackBoolsKeyed;
