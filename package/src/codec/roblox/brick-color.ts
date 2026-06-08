// Internal
import * as Type from "@type";

const brickColor = {
    write: (writer, value) => {
        writer.u16(value.Number);
    },
    read: (cursor) => new BrickColor(cursor.u16()),
    _default: new BrickColor("White"),
} as Type.Codec.Internal<BrickColor> as Type.Codec.External<BrickColor>;

export default brickColor;
