// Internal
import * as Type from "@type";

function tuple<T extends Type.Codec.External<unknown>[]>(...values: T) {
    const internalValues = values as unknown as Type.Codec.Internal<unknown>[];

    return {
        write: (writer, value) => {
            internalValues.forEach((codec, i) => {
                codec.write(writer, value[i]);
            });
        },
        read: (cursor) => {
            const result: unknown[] = [];
            internalValues.forEach((codec, i) => {
                result[i] = codec.read(cursor);
            });

            return result;
        },
        _default: [] as { [K in keyof T]: Type.Codec.Infer<T[K]> },
    } as Type.Codec.Internal<{
        [K in keyof T]: Type.Codec.Infer<T[K]>;
    }> as Type.Codec.External<{ [K in keyof T]: Type.Codec.Infer<T[K]> }>;
}

export default tuple;
