// Internal
import * as Type from "@type";

// Primitive
import Num from "@codec/primitive/num";

function vector3(
    x: Type.Codec.External<number>,
    y: Type.Codec.External<number>,
    z: Type.Codec.External<number>,
) {
    const internalX = x as Type.Codec.Internal<number>;
    const internalY = y as Type.Codec.Internal<number>;
    const internalZ = z as Type.Codec.Internal<number>;

    return {
        write: (writer, value) => {
            internalX.write(writer, value.X);
            internalY.write(writer, value.Y);
            internalZ.write(writer, value.Z);
        },
        read: (cursor) =>
            new Vector3(internalX.read(cursor), internalY.read(cursor), internalZ.read(cursor)),
        _default: Vector3.zero,
    } as Type.Codec.Internal<Vector3> as Type.Codec.External<Vector3>;
}

export default setmetatable(vector3(Num.f32, Num.f32, Num.f32), {
    __call: (_self, ...args: Array<unknown>) =>
        vector3(
            args[0] as Type.Codec.External<number>,
            args[1] as Type.Codec.External<number>,
            args[2] as Type.Codec.External<number>,
        ),
}) as Type.Codec.Vector3;
