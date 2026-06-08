// Internal
import * as Type from "../type";

// Codec
import Primitive from "./primitive";
import Composite from "./composite";
import Roblox from "./roblox";

export type Codec<T> = Type.Codec.External<T>;

const Codec = {
    ...Primitive,
    ...Composite,
    ...Roblox,
};

export default Codec;
