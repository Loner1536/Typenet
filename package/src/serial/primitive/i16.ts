// Types
import * as Types from "../../types";

export default {
    encode: (write, value) => write.i16(value),
    decode: (read) => read.i16(),
} as Types.InternalCodec<number> as Types.Codec<number>;
