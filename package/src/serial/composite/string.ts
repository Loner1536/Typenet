// Root
import * as Types from "../../types";

export default {
    encode: (writer, value) => writer.string(value),
    decode: (reader) => reader.string(),
} as Types.InternalCodec<string> as Types.Codec<string>;
