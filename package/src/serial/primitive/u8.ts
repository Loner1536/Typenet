// Types
import * as Types from "../../types";

export default {
    encode: (write, value) => write.u8(value),
    decode: (read) => read.u8(),
} as Types.InternalCodec<number> as Types.Codec<number>;
