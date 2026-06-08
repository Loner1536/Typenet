// Internal
import * as Type from "@type";

function set<T>(codec: Type.Codec.External<T>) {
    const internalCodec = codec as Type.Codec.Internal<T>;

    return {
        write: (writer, value) => {
            writer.u16(value.size());

            value.forEach((v) => {
                internalCodec.write(writer, v);
            });
        },
        read: (cursor) => {
            const len = cursor.u16();

            const result = new Set<T>();
            for (let i = 0; i < len; i++) {
                const value = internalCodec.read(cursor);

                result.add(value);
            }

            return result;
        },
        _default: new Set<T>(),
    } as Type.Codec.Internal<Set<T>> as Type.Codec.External<Set<T>>;
}

export default set;
