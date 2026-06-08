//!optimize 2
//!native

// Internal
import Constant from "@constant";
import * as Type from "@type";

// Security
import Report from "@security/report";

function float(min: number, max: number, precision?: number): Type.Codec.External<number> {
    if (precision === undefined) {
        return {
            write: (writer, value) => writer.f16(value),
            read: (cursor) => cursor.f16(),
            _default: min,
        } as Type.Codec.Internal<number> as Type.Codec.External<number>;
    }

    const steps = math.floor((max - min) / precision);

    let write: (writer: Type.Writer, value: number) => void;
    let read: (cursor: Type.Cursor) => number;

    if (steps <= Constant.U8_MAX) {
        write = (writer, value) => writer.u8(math.round((value - min) / precision));
        read = (cursor) => cursor.u8() * precision + min;
    } else if (steps <= Constant.U16_MAX) {
        write = (writer, value) => writer.u16(math.round((value - min) / precision));
        read = (cursor) => cursor.u16() * precision + min;
    } else if (steps <= Constant.U24_MAX) {
        write = (writer, value) => writer.u24(math.round((value - min) / precision!));
        read = (cursor) => cursor.u24() * precision! + min;
    } else if (steps <= Constant.U32_MAX) {
        write = (writer, value) => writer.u32(math.round((value - min) / precision));
        read = (cursor) => cursor.u32() * precision + min;
    } else {
        Report.log("warn", "CODEC_FLOAT_STEPS_EXCEEDED", { min, max, precision, steps });

        write = (writer, value) => writer.f32(value);
        read = (cursor) => cursor.f32();
    }

    return {
        write,
        read,
        _default: min,
    } as Type.Codec.Internal<number> as Type.Codec.External<number>;
}

export default float;
