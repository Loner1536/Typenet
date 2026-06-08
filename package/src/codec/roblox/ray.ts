// Internal
import * as Type from "@type";

// Primitive
import vector3 from "./vector3";

function numberRange(
    origin: Type.Codec.External<Vector3>,
    direction: Type.Codec.External<Vector3>,
) {
    const internalOrigin = origin as Type.Codec.Internal<Vector3>;
    const internalDirection = direction as Type.Codec.Internal<Vector3>;

    return {
        write: (writer, value) => {
            internalOrigin.write(writer, value.Origin);
            internalDirection.write(writer, value.Direction);
        },
        read: (cursor) => new Ray(internalOrigin.read(cursor), internalDirection.read(cursor)),
        _default: new Ray(Vector3.zero, Vector3.zero),
    } as Type.Codec.Internal<Ray> as Type.Codec.External<Ray>;
}

export default setmetatable(numberRange(vector3, vector3), {
    __call: (_self, ...args: Array<unknown>) =>
        numberRange(
            args[0] as Type.Codec.External<Vector3>,
            args[1] as Type.Codec.External<Vector3>,
        ),
}) as Type.Codec.Ray;
