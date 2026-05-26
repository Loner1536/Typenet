// Types
import * as Types from "../../types";

export default {
    encode: (write, value) => write.f64(value),
    decode: (read) => read.f64(),
} as Types.InternalCodec<number> as Types.Codec<number>;
