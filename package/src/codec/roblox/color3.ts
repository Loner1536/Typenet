// Internal
import * as Type from "@type";

const color3 = {
    write: (writer, value) => {
        writer.f16(value.R);
        writer.f16(value.G);
        writer.f16(value.B);
    },
    read: (cursor) => new Color3(cursor.f16(), cursor.f16(), cursor.f16()),
    _default: new Color3(1, 1, 1),
} as Type.Codec.Internal<Color3> as Type.Codec.External<Color3>;

export default color3;
