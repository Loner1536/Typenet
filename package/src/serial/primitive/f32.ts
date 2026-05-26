// Types
import * as Types from "../../types";

export default {
    encode: (write, value) => write.f32(value),
    decode: (read) => read.f32(),
} as Types.InternalCodec<number> as Types.Codec<number>;
