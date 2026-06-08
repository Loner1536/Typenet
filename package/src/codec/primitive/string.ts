// Internal
import * as Type from "@type";

// Codec
import Num from "./num";

function str(length: Type.Codec.External<number>) {
    const internalLength = length as Type.Codec.Internal<number>;

    return {
        write: (writer, value) => {
            const len = value.size();

            internalLength.write(writer, value.size());
            writer.string(value, len);
        },
        read: (cursor) => {
            const len = internalLength.read(cursor);

            return cursor.string(len);
        },
        _default: "",
    } as Type.Codec.Internal<string> as Type.Codec.External<string>;
}

export default setmetatable(str(Num.u32), {
    __call: (_self, ...args: Array<unknown>) => str(args[0] as Type.Codec.External<number>),
}) as Type.Codec.String;
