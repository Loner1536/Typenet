// Root
import * as Types from "../types";

// Codec

const Codec = {
    none: {
        encode: () => { },
        decode: () => [undefined, 0] as LuaTuple<[unknown, number]>,
        _raw: true,
    } as unknown as Types.Codec<unknown>,
};

export default Codec;
