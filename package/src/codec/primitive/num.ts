//!optimize 2
//!native

// Internal
import Constant from "@constant";
import * as Type from "@type";

// Security
import Report from "@security/report";

function define<T>(
    write: (writer: Type.Writer, value: T) => void,
    read: (cursor: Type.Cursor) => T,
    directWrite: (buf: buffer, off: number, value: T) => void,
    directRead: (buf: buffer, off: number) => T,
    size: number,
) {
    return {
        write,
        read,

        _directWrite: directWrite,
        _directRead: directRead,

        _default: 0,
        _size: size,
    } as Type.Codec.Internal<T> as Type.Codec.External<T>;
}

function clamp(value: number, min: number, max: number, t: string): number {
    if (value < min || value > max) {
        Report.log("warn", "PRIMITIVE_OVERFLOW", { value, min, max, type: t });
        return math.clamp(value, min, max);
    }
    return value;
}

const Num = {
    u8: define<number>(
        (w, v) => w.u8(clamp(v, 0, Constant.U8_MAX, "u8")),
        (c) => c.u8(),
        (b, o, v) => buffer.writeu8(b, o, v),
        (b, o) => buffer.readu8(b, o),
        1,
    ),
    u16: define<number>(
        (w, v) => w.u16(clamp(v, 0, Constant.U16_MAX, "u16")),
        (c) => c.u16(),
        (b, o, v) => buffer.writeu16(b, o, v),
        (b, o) => buffer.readu16(b, o),
        2,
    ),
    u32: define<number>(
        (w, v) => w.u32(clamp(v, 0, Constant.U32_MAX, "u32")),
        (c) => c.u32(),
        (b, o, v) => buffer.writeu32(b, o, v),
        (b, o) => buffer.readu32(b, o),
        4,
    ),
    i8: define<number>(
        (w, v) => w.i8(clamp(v, Constant.I8_MIN, Constant.I8_MAX, "i8")),
        (c) => c.i8(),
        (b, o, v) => buffer.writei8(b, o, v),
        (b, o) => buffer.readi8(b, o),
        1,
    ),
    i16: define<number>(
        (w, v) => w.i16(clamp(v, Constant.I16_MIN, Constant.I16_MAX, "i16")),
        (c) => c.i16(),
        (b, o, v) => buffer.writei16(b, o, v),
        (b, o) => buffer.readi16(b, o),
        2,
    ),
    i32: define<number>(
        (w, v) => w.i32(clamp(v, Constant.I32_MIN, Constant.I32_MAX, "i32")),
        (c) => c.i32(),
        (b, o, v) => buffer.writei32(b, o, v),
        (b, o) => buffer.readi32(b, o),
        4,
    ),
    f32: define<number>(
        (w, v) => w.f32(v),
        (c) => c.f32(),
        (b, o, v) => buffer.writef32(b, o, v),
        (b, o) => buffer.readf32(b, o),
        4,
    ),
    f64: define<number>(
        (w, v) => w.f64(v),
        (c) => c.f64(),
        (b, o, v) => buffer.writef64(b, o, v),
        (b, o) => buffer.readf64(b, o),
        8,
    ),

    f16: {
        write: (w, v) => w.f16(v),
        read: (c) => c.f16(),
        _default: 0,
        _size: 2,
    } as Type.Codec.Internal<number> as Type.Codec.External<number>,

    u24: {
        write: (w, v) => w.u24(v),
        read: (c) => c.u24(),
        _default: 0,
        _size: 3,
    } as Type.Codec.Internal<number> as Type.Codec.External<number>,
};

export default Num;
