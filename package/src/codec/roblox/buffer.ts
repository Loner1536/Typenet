// Internal
import * as Type from "@type";

const buff = {
    write: (writer, value) => {
        const len = buffer.len(value);
        writer.u32(len);
        writer.bytes(value, 0, len);
    },
    read: (cursor) => {
        const len = cursor.u32();
        return cursor.bytes(len);
    },
    _default: buffer.create(0),
} as Type.Codec.Internal<buffer> as Type.Codec.External<buffer>;

export default buff;
