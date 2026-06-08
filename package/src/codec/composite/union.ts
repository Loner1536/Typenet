// Package
import Object from "@rbxts/object-utils";

// Internal
import Constant from "@constant";
import * as Type from "@type";

// Security
import Report from "@security/report";

function union<V extends Record<string, Type.Codec.External<unknown>>>(variants: V) {
    const keys = (Object.keys(variants) as string[]).sort();
    const internalVariants = variants as unknown as Record<string, Type.Codec.Internal<unknown>>;

    if (keys.size() > Constant.U8_MAX) {
        Report.log("warn", "CODEC_UNION_TOO_MANY_VARIANTS", { count: keys.size() });
    }

    const keyToIndex = new Map<string, number>();
    keys.forEach((key, i) => keyToIndex.set(key, i));

    return {
        write: (writer, value) => {
            const _value = value as { type: string } & Record<string, unknown>;
            const _type = _value.type;
            const index = keyToIndex.get(_type);

            if (index === undefined) {
                Report.log("warn", "CODEC_UNION_UNKNOWN_VARIANT", { type: _type });
                writer.u8(0);
                return;
            }

            writer.u8(index);

            const data: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(_value)) {
                if (k !== "type") data[k] = v;
            }

            internalVariants[_type].write(writer, data);
        },
        read: (cursor) => {
            const index = cursor.u8();

            if (index >= keys.size()) {
                Report.log("warn", "CODEC_UNION_INVALID_INDEX", { index, max: keys.size() });
                return { type: keys[0] };
            }

            const _type = keys[index];
            const data = internalVariants[_type].read(cursor) as Record<string, unknown>;

            data["type"] = _type;
            return data;
        },
        _default: { type: keys[0] },
    } as Type.Codec.Internal<Type.Codec.Union<V>> as Type.Codec.External<Type.Codec.Union<V>>;
}

export default union;
