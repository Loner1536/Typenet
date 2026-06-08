// Internal
import * as Type from "@type";

function map<K, V>(key: Type.Codec.External<K>, value: Type.Codec.External<V>) {
    const internalKey = key as Type.Codec.Internal<K>;
    const internalValue = value as Type.Codec.Internal<V>;

    return {
        write: (writer, value) => {
            writer.u16(value.size());

            const entries: [K, V][] = [];
            value.forEach((v, k) => entries.push([k, v]));
            entries.sort((a, b) => tostring(a[0]) < tostring(b[0]));

            entries.forEach(([k, v]) => {
                internalKey.write(writer, k);
                internalValue.write(writer, v);
            });
        },
        read: (cursor) => {
            const len = cursor.u16();

            const result = new Map<K, V>();
            for (let i = 0; i < len; i++) {
                const key = internalKey.read(cursor);
                const value = internalValue.read(cursor);

                result.set(key, value);
            }

            return result;
        },
        _default: new Map(),
    } as Type.Codec.Internal<Map<K, V>> as Type.Codec.External<Map<K, V>>;
}

export default map;
