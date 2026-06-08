// Internal
import * as Type from "@type";

// Primitive
import literal from "./literal";
import float from "./float";
import str from "./string";
import zint from "./zint";
import int from "./int";
import Num from "./num";

const Primitive = {
    ...Num,

    string: str,
    literal,
    float,
    zint,
    int,

    boolean: {
        write: (w, v) => w.bool(v),
        read: (c) => c.bool(),
        _default: false,
    } as Type.Codec.Internal<boolean> as Type.Codec.External<boolean>,
};

export default Primitive;
