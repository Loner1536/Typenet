// Internal
import * as Type from "@type";

function encodeZigzag(n: number): number {
    return bit32.bxor(bit32.lshift(n, 1), bit32.arshift(n, 31));
}
function decodeZigzag(n: number): number {
    return bit32.bxor(bit32.rshift(n, 1), -bit32.band(n, 1));
}

const zint = {
    write: (writer, value) => {
        let n = encodeZigzag(value);

        while (n > 0x7f) {
            writer.u8(bit32.bor(bit32.band(n, 0x7f), 0x80));
            n = bit32.rshift(n, 7);
        }
        writer.u8(n);
    },
    read: (cursor) => {
        let n = 0;
        let shift = 0;

        while (true) {
            const byte = cursor.u8();
            n = bit32.bor(n, bit32.lshift(bit32.band(byte, 0x7f), shift));
            shift += 7;

            if (bit32.band(byte, 0x80) === 0) break;
        }

        return decodeZigzag(n);
    },
    _default: 0,
} as Type.Codec.Internal<number> as Type.Codec.External<number>;

export default zint;
