// Internal
import * as Type from "@type";

// Primitive
import Num from "@codec/primitive/num";

function numberRange(min: Type.Codec.External<number>, max: Type.Codec.External<number>) {
    const internalMin = min as Type.Codec.Internal<number>;
    const internalMax = max as Type.Codec.Internal<number>;

    return {
        write: (writer, value) => {
            internalMin.write(writer, value.Min);
            internalMax.write(writer, value.Max);
        },
        read: (cursor) => new NumberRange(internalMin.read(cursor), internalMax.read(cursor)),
        _default: new NumberRange(0, 0),
    } as Type.Codec.Internal<NumberRange> as Type.Codec.External<NumberRange>;
}

export default setmetatable(numberRange(Num.f16, Num.f16), {
    __call: (_self, ...args: Array<unknown>) =>
        numberRange(args[0] as Type.Codec.External<number>, args[1] as Type.Codec.External<number>),
}) as Type.Codec.NumberRange;
