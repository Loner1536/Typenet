// Internal
import * as Type from "@type";

function optional<T>(codec: Type.Codec.External<T>): Type.Codec.External<T | undefined> {
    const internalCodec = codec as Type.Codec.Internal<T>;

    return {
        write: (writer, value) => {
            if (value === undefined) {
                writer.u8(0);
                return;
            }
            writer.u8(1);
            internalCodec.write(writer, value);
        },
        read: (cursor) => {
            const present = cursor.u8();
            if (present === 0) return undefined;
            return internalCodec.read(cursor);
        },
        _default: undefined,
    } as Type.Codec.Internal<T | undefined> as Type.Codec.External<T | undefined>;
}

export default optional;
