// Internal
import * as Type from "@type";

// Primitive
import vector2 from "./vector2";

function numberRange(min: Type.Codec.External<Vector2>, max: Type.Codec.External<Vector2>) {
    const internalMin = min as Type.Codec.Internal<Vector2>;
    const internalMax = max as Type.Codec.Internal<Vector2>;

    return {
        write: (writer, value) => {
            internalMin.write(writer, value.Min);
            internalMax.write(writer, value.Max);
        },
        read: (cursor) => new Rect(internalMin.read(cursor), internalMax.read(cursor)),
        _default: new Rect(),
    } as Type.Codec.Internal<Rect> as Type.Codec.External<Rect>;
}

export default setmetatable(numberRange(vector2, vector2), {
    __call: (_self, ...args: Array<unknown>) =>
        numberRange(
            args[0] as Type.Codec.External<Vector2>,
            args[1] as Type.Codec.External<Vector2>,
        ),
}) as Type.Codec.Rect;
