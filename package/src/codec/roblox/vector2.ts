// Internal
import * as Type from "@type";

// Primitive
import Num from "@codec/primitive/num";

function vector2(x: Type.Codec.External<number>, y: Type.Codec.External<number>) {
    const internalX = x as Type.Codec.Internal<number>;
    const internalY = y as Type.Codec.Internal<number>;

    return {
        write: (writer, value) => {
            internalX.write(writer, value.X);
            internalY.write(writer, value.Y);
        },
        read: (cursor) => new Vector2(internalX.read(cursor), internalY.read(cursor)),
        _default: Vector2.zero,
    } as Type.Codec.Internal<Vector2> as Type.Codec.External<Vector2>;
}

export default setmetatable(vector2(Num.f32, Num.f32), {
    __call: (_self, ...args: Array<unknown>) =>
        vector2(args[0] as Type.Codec.External<number>, args[1] as Type.Codec.External<number>),
}) as Type.Codec.Vector2;
