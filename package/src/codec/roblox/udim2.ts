// Internal
import * as Type from "@type";

// Primitive
import Num from "@codec/primitive/num";

function udim2(xOffset: Type.Codec.External<number>, yOffset: Type.Codec.External<number>) {
    const internalXOffset = xOffset as Type.Codec.Internal<number>;
    const internalYOffset = yOffset as Type.Codec.Internal<number>;

    return {
        write: (writer, value) => {
            writer.f16(value.X.Scale);
            internalXOffset.write(writer, value.X.Offset);
            writer.f16(value.Y.Scale);
            internalYOffset.write(writer, value.Y.Offset);
        },
        read: (cursor) =>
            new UDim2(
                cursor.f16(),
                internalXOffset.read(cursor),
                cursor.f16(),
                internalYOffset.read(cursor),
            ),
        _default: new UDim2(0, 0, 0, 0),
    } as Type.Codec.Internal<UDim2> as Type.Codec.External<UDim2>;
}

export default setmetatable(udim2(Num.f16, Num.f16), {
    __call: (_self, ...args: Array<unknown>) =>
        udim2(args[0] as Type.Codec.External<number>, args[1] as Type.Codec.External<number>),
}) as Type.Codec.UDim2;
