// Internal
import Constant from "@constant";
import * as Type from "@type";

// Security
import Report from "@security/report";

function literal<T extends readonly (string | number | boolean)[]>(
    ...values: T
): Type.Codec.External<T[number]> {
    if (values.size() > Constant.U8_MAX) {
        Report.log("warn", "CODEC_LITERAL_TOO_MANY_VALUES", { count: values.size() });
    }

    return {
        write: (writer, value) => {
            const index = (values as unknown as defined[]).indexOf(value as defined);
            if (index === -1) {
                Report.log("warn", "CODEC_LITERAL_UNKNOWN_VALUE", {
                    value: tostring(value as defined),
                });
                writer.u8(0);
                return;
            }
            writer.u8(index);
        },
        read: (cursor) => {
            const index = cursor.u8();
            if (index >= values.size()) {
                Report.log("warn", "CODEC_LITERAL_INVALID_INDEX", { index, max: values.size() });
                return values[0];
            }
            return values[index];
        },
        _default: values[0],
    } as Type.Codec.Internal<T[number]> as Type.Codec.External<T[number]>;
}

export default literal;
