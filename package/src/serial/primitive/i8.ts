// Types
import * as Types from "../../types";

export default {
    encode: (write, value) => write.i8(value),
    decode: (read) => read.i8(),
} as Types.InternalCodec<number> as Types.Codec<number>;
