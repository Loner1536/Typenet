// Internal
import * as Type from "@type";

// Security
import Report from "@security/report";

function enumCodec<T extends EnumItem>(enumType: { GetEnumItems(): T[] }) {
    const items = enumType.GetEnumItems();
    const valueToItem = new Map<number, T>();

    items.forEach((item) => valueToItem.set(item.Value, item));

    return {
        write: (writer, value) => {
            writer.u16(value.Value);
        },
        read: (cursor) => {
            const value = cursor.u16();
            const item = valueToItem.get(value);

            if (item === undefined) {
                Report.log("warn", "CODEC_ENUM_UNKNOWN_VALUE", { value });
                return items[0];
            }

            return item;
        },
        _default: items[0],
    } as Type.Codec.Internal<T> as Type.Codec.External<T>;
}

export default enumCodec;
