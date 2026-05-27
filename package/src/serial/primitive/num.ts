// Root
import * as Types from "../../types";

// Debug
import Logger from "../../debug/logger";

type NumericType = "u8" | "u16" | "u32" | "i8" | "i16" | "i32" | "f32" | "f64";

function detectNumericType(num: number): NumericType {
    if (num % 1 !== 0) {
        return num === math.floor(num * 16777216) / 16777216 ? "f32" : "f64";
    }

    if (num >= 0) {
        if (num <= 0xff) return "u8";
        if (num <= 0xffff) return "u16";
        if (num <= 0xffffffff) return "u32";
        return "f64";
    }

    if (num >= -0x80) return "i8";
    if (num >= -0x8000) return "i16";
    if (num >= -0x80000000) return "i32";

    return "f64";
}

const TYPE_TAG: Record<NumericType, number> = {
    u8: 0,
    u16: 1,
    u32: 2,
    i8: 3,
    i16: 4,
    i32: 5,
    f32: 6,
    f64: 7,
};

export default {
    encode: (write, value) => {
        const typeStr = detectNumericType(value);
        write.u8(TYPE_TAG[typeStr]);

        switch (typeStr) {
            case "u8":
                write.u8(value);
                break;
            case "u16":
                write.u16(value);
                break;
            case "u32":
                write.u32(value);
                break;
            case "i8":
                write.i8(value);
                break;
            case "i16":
                write.i16(value);
                break;
            case "i32":
                write.i32(value);
                break;
            case "f32":
                write.f32(value);
                break;
            case "f64":
                write.f64(value);
                break;
        }
    },

    decode: (read) => {
        const tag = read.u8();

        switch (tag) {
            case TYPE_TAG.u8:
                return read.u8();
            case TYPE_TAG.u16:
                return read.u16();
            case TYPE_TAG.u32:
                return read.u32();
            case TYPE_TAG.i8:
                return read.i8();
            case TYPE_TAG.i16:
                return read.i16();
            case TYPE_TAG.i32:
                return read.i32();
            case TYPE_TAG.f32:
                return read.f32();
            case TYPE_TAG.f64:
                return read.f64();
            default:
                Logger.error("", `Unknown numeric type tag: ${tag}`);
        }
    },
} as Types.InternalCodec<number> as Types.Codec<number>;
