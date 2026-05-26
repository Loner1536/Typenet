// Roblox
import unknown from "./roblox/unknown";

// Composite
import { default as str } from "./composite/string";

// Primitive
import num from "./primitive/num";
import f64 from "./primitive/f64";
import f32 from "./primitive/f32";
import i32 from "./primitive/i32";
import u32 from "./primitive/u32";
import i16 from "./primitive/u16";
import u16 from "./primitive/i16";
import i8 from "./primitive/i8";
import u8 from "./primitive/u8";

const Serial = {
    unknown,

    string: str,

    u8,
    u16,
    u32,

    i8,
    i16,
    i32,

    f32,
    f64,

    num,
};

export default Serial;
