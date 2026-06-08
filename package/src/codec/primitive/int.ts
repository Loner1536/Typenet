//!optimize 2
//!native

// Internal
import Constant from "@constant";
import * as Type from "@type";

function int(min: number, max: number): Type.Codec.External<number> {
    const range = max - min;

    let write: (writer: Type.Writer, value: number) => void;
    let read: (cursor: Type.Cursor) => number;
    let directWrite: (buf: buffer, off: number, value: number) => void;
    let directRead: (buf: buffer, off: number) => number;

    let size: number;

    if (range <= Constant.U8_MAX) {
        write = (writer, value) => writer.u8(value - min);
        read = (cursor) => cursor.u8() + min;
        directWrite = (b, o, v) => buffer.writeu8(b, o, v - min);
        directRead = (b, o) => buffer.readu8(b, o) + min;

        size = 1;
    } else if (range <= Constant.U16_MAX) {
        write = (writer, value) => writer.u16(value - min);
        read = (cursor) => cursor.u16() + min;
        directWrite = (b, o, v) => buffer.writeu16(b, o, v - min);
        directRead = (b, o) => buffer.readu16(b, o) + min;

        size = 2;
    } else if (range <= Constant.U24_MAX) {
        write = (writer, value) => writer.u24(value - min);
        read = (cursor) => cursor.u24() + min;

        size = 3;
    } else {
        write = (writer, value) => writer.u32(value - min);
        read = (cursor) => cursor.u32() + min;
        directWrite = (b, o, v) => buffer.writeu32(b, o, v - min);
        directRead = (b, o) => buffer.readu32(b, o) + min;

        size = 4;
    }

    return {
        write,
        read,
        _directWrite: directWrite!,
        _directRead: directRead!,

        _default: min,

        _size: size,
    } as Type.Codec.Internal<number> as Type.Codec.External<number>;
}

export default int;
