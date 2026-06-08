// Internal
import * as Type from "@type";

// Primitive
import Num from "@codec/primitive/num";

function udim(offset: Type.Codec.External<number>) {
    const internalOffset = offset as Type.Codec.Internal<number>;

    return {
        write: (writer, value) => {
            writer.f16(value.Scale);
            internalOffset.write(writer, value.Offset);
        },
        read: (cursor) => new UDim(cursor.f16(), internalOffset.read(cursor)),
        _default: new UDim(0, 0),
    } as Type.Codec.Internal<UDim> as Type.Codec.External<UDim>;
}

export default setmetatable(udim(Num.f16), {
    __call: (_self, ...args: Array<unknown>) => udim(args[0] as Type.Codec.External<number>),
}) as Type.Codec.UDim;
