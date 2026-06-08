//!optimize 2
//!native

// Security
import Report from "@security/report";

// Internal
import { IS_SERVER } from "@environment";

export class Cursor {
    private player: Player | undefined;

    public buf: buffer;
    public offset = 0;

    constructor(buf: buffer, player?: Player) {
        this.buf = buf;
        this.player = player;
    }

    public reset(buf: buffer) {
        this.buf = buf;
        this.offset = 0;
    }

    public remaining(): number {
        return buffer.len(this.buf) - this.offset;
    }

    public ensureRemaining(bytes: number) {
        if (this.offset + bytes > buffer.len(this.buf)) {
            if (IS_SERVER && this.player !== undefined) {
                Report.log("kick", "CURSOR_UNDERFLOW", {
                    player: this.player,
                    offset: this.offset,
                    needed: bytes,
                    size: buffer.len(this.buf),
                });
            } else {
                Report.log("warn", "CURSOR_UNDERFLOW", {
                    offset: this.offset,
                    needed: bytes,
                    size: buffer.len(this.buf),
                });
            }
        }
    }

    public varint(): number {
        let result = 0;
        let shift = 0;
        while (true) {
            const byte = this.u8();
            result = bit32.bor(result, bit32.lshift(bit32.band(byte, 0x7f), shift));
            if (bit32.band(byte, 0x80) === 0) return result;
            shift += 7;
            if (shift > 28) {
                Report.log("warn", "VARINT_TOO_LONG");
                return result;
            }
        }
    }

    public u8(): number {
        this.ensureRemaining(1);
        const v = buffer.readu8(this.buf, this.offset);
        this.offset += 1;
        return v;
    }

    public u16(): number {
        this.ensureRemaining(2);
        const v = buffer.readu16(this.buf, this.offset);
        this.offset += 2;
        return v;
    }

    public u24(): number {
        this.ensureRemaining(3);
        const v = bit32.bor(
            buffer.readu8(this.buf, this.offset),
            bit32.lshift(buffer.readu8(this.buf, this.offset + 1), 8),
            bit32.lshift(buffer.readu8(this.buf, this.offset + 2), 16),
        );
        this.offset += 3;
        return v;
    }

    public u32(): number {
        this.ensureRemaining(4);
        const v = buffer.readu32(this.buf, this.offset);
        this.offset += 4;
        return v;
    }

    public i8(): number {
        this.ensureRemaining(1);
        const v = buffer.readi8(this.buf, this.offset);
        this.offset += 1;
        return v;
    }

    public i16(): number {
        this.ensureRemaining(2);
        const v = buffer.readi16(this.buf, this.offset);
        this.offset += 2;
        return v;
    }

    public i32(): number {
        this.ensureRemaining(4);
        const v = buffer.readi32(this.buf, this.offset);
        this.offset += 4;
        return v;
    }

    public f16(): number {
        this.ensureRemaining(2);
        const bits = buffer.readu16(this.buf, this.offset);
        this.offset += 2;

        const sign = bit32.rshift(bits, 15) === 1 ? -1 : 1;
        const exp = bit32.band(bit32.rshift(bits, 10), 0x1f);
        const mantissa = bit32.band(bits, 0x3ff);

        if (exp === 0x1f) {
            return mantissa === 0 ? sign * math.huge : 0 / 0;
        }

        if (exp === 0) {
            return sign * math.pow(2, -14) * (mantissa / 1024);
        }

        return sign * math.pow(2, exp - 15) * (1 + mantissa / 1024);
    }
    public f32(): number {
        this.ensureRemaining(4);
        const v = buffer.readf32(this.buf, this.offset);
        this.offset += 4;
        return v;
    }

    public f64(): number {
        this.ensureRemaining(8);
        const v = buffer.readf64(this.buf, this.offset);
        this.offset += 8;
        return v;
    }

    public bool(): boolean {
        return this.u8() !== 0;
    }

    public string(len: number): string {
        this.ensureRemaining(len);
        const v = buffer.readstring(this.buf, this.offset, len);
        this.offset += len;
        return v;
    }

    public copyRange(s: number, e: number): buffer {
        const size = e - s;
        const out = buffer.create(size);
        buffer.copy(out, 0, this.buf, s, size);
        return out;
    }

    public bytes(length: number): buffer {
        this.ensureRemaining(length);
        const out = buffer.create(length);
        buffer.copy(out, 0, this.buf, this.offset, length);
        this.offset += length;
        return out;
    }

    public getPlayer(): Player | undefined {
        return this.player;
    }
}

export default Cursor;
