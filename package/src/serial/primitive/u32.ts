// Types
import * as Types from "../../types";

export default {
    encode: (write, value) => write.u32(value),
    decode: (read) => read.u32(),
} as Types.InternalCodec<number> as Types.Codec<number>;
