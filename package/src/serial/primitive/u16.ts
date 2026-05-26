// Types
import * as Types from "../../types";

export default {
    encode: (write, value) => write.u16(value),
    decode: (read) => read.u16(),
} as Types.InternalCodec<number> as Types.Codec<number>;
