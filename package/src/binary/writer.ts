//!optimize 2
//!native

// Internal
import Constant from "@constant";

// Security
import Report from "@security/report";

export class Writer {
    public buf: buffer;
    public offset = 0;

    constructor() {
        this.buf = buffer.create(Constant.WRITER_BYTE_SIZE);
    }

    public reset() {
        this.offset = 0;
    }

    public ensureSpace(bytes: number) {
        if (this.offset + bytes > buffer.len(this.buf)) {
            Report.log("fatal", "WRITER_OVERFLOW", {
                offset: this.offset,
                needed: bytes,
                size: buffer.len(this.buf),
            });
        }
    }

    public used(): number {
        return this.offset;
    }

    public varint(value: number) {
        while (value >= 0x80) {
            this.u8(bit32.bor(bit32.band(value, 0x7f), 0x80));
            value = math.floor(value / 128);
        }
        this.u8(value);
    }

    public copyOut(s: number, e: number): buffer {
        const size = e - s;
        const out = buffer.create(size);
        buffer.copy(out, 0, this.buf, s, size);

        return out;
    }

    public u8(value: number) {
        this.ensureSpace(1);
        buffer.writeu8(this.buf, this.offset, value);
        this.offset += 1;
    }

    public u16(value: number) {
        this.ensureSpace(2);
        buffer.writeu16(this.buf, this.offset, value);
        this.offset += 2;
    }

    public u24(value: number) {
        this.ensureSpace(3);
        buffer.writeu8(this.buf, this.offset, bit32.band(value, 0xff));
        buffer.writeu8(this.buf, this.offset + 1, bit32.band(bit32.rshift(value, 8), 0xff));
        buffer.writeu8(this.buf, this.offset + 2, bit32.band(bit32.rshift(value, 16), 0xff));
        this.offset += 3;
    }

    public u32(value: number) {
        this.ensureSpace(4);
        buffer.writeu32(this.buf, this.offset, value);
        this.offset += 4;
    }

    public i8(value: number) {
        this.ensureSpace(1);
        buffer.writei8(this.buf, this.offset, value);
        this.offset += 1;
    }

    public i16(value: number) {
        this.ensureSpace(2);
        buffer.writei16(this.buf, this.offset, value);
        this.offset += 2;
    }

    public i32(value: number) {
        this.ensureSpace(4);
        buffer.writei32(this.buf, this.offset, value);
        this.offset += 4;
    }

    public f16(value: number) {
        this.ensureSpace(2);

        if (value !== value) {
            buffer.writeu16(this.buf, this.offset, 0x7e00);
            this.offset += 2;
            return;
        }

        const sign = value < 0 ? 1 : 0;
        value = math.abs(value);

        if (value === math.huge) {
            buffer.writeu16(this.buf, this.offset, sign * 0x8000 + 0x7c00);
            this.offset += 2;
            return;
        }

        if (value === 0) {
            buffer.writeu16(this.buf, this.offset, 0);
            this.offset += 2;
            return;
        }

        const f32buf = buffer.create(4);
        buffer.writef32(f32buf, 0, value);
        const bits = buffer.readu32(f32buf, 0);

        const exp = bit32.band(bit32.rshift(bits, 23), 0xff) - 127 + 15;
        const mantissa = bit32.band(bits, 0x7fffff);

        if (exp >= 31) {
            buffer.writeu16(this.buf, this.offset, bit32.bor(bit32.lshift(sign, 15), 0x7c00));
        } else if (exp <= 0) {
            buffer.writeu16(this.buf, this.offset, 0);
        } else {
            buffer.writeu16(
                this.buf,
                this.offset,
                bit32.bor(
                    bit32.lshift(sign, 15),
                    bit32.lshift(exp, 10),
                    bit32.rshift(mantissa, 13),
                ),
            );
        }

        this.offset += 2;
    }

    public f32(value: number) {
        this.ensureSpace(4);
        buffer.writef32(this.buf, this.offset, value);
        this.offset += 4;
    }

    public f64(value: number) {
        this.ensureSpace(8);
        buffer.writef64(this.buf, this.offset, value);
        this.offset += 8;
    }

    public bool(value: boolean) {
        this.u8(value ? 1 : 0);
    }

    public string(value: string, len: number) {
        this.ensureSpace(len);
        buffer.writestring(this.buf, this.offset, value);
        this.offset += len;
    }

    public bytes(src: buffer, srcOffset: number, length: number) {
        this.ensureSpace(length);
        buffer.copy(this.buf, this.offset, src, srcOffset, length);
        this.offset += length;
    }
}

export default Writer;
