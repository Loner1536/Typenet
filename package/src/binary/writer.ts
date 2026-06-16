//!optimize 2
//!native

// Internal
import Constant from "@constant";

const scratch = buffer.create(Constant.MAX_BYTE_SIZE);

export default class Writer {
    private offset = 0;

    public ensure(bytes: number) {
        if (this.offset + bytes > buffer.len(scratch)) {
            // TODO: Add logging
            error(`[Writer] Overflow: tried to write ${bytes}B at offset ${this.offset}`);
        }
    }

    public u8(num: number) {
        this.ensure(1);
        buffer.writeu8(scratch, this.offset, num);
        this.offset += 1;
    }
    public u16(num: number) {
        this.ensure(2);
        buffer.writeu16(scratch, this.offset, num);
        this.offset += 2;
    }
    public u32(num: number) {
        this.ensure(4);
        buffer.writeu32(scratch, this.offset, num);
        this.offset += 4;
    }
    public varuint(num: number) {
        while (true) {
            const byte = num & 0x7f;
            num >>>= 7;
            if (num === 0) {
                this.ensure(1);
                buffer.writeu8(scratch, this.offset, byte);
                this.offset += 1;
                break;
            }
            this.ensure(1);
            buffer.writeu8(scratch, this.offset, byte | 0x80);
            this.offset += 1;
        }
    }

    public i8(num: number) {
        this.ensure(1);
        buffer.writei8(scratch, this.offset, num);
        this.offset += 1;
    }
    public i16(num: number) {
        this.ensure(2);
        buffer.writei16(scratch, this.offset, num);
        this.offset += 2;
    }
    public i32(num: number) {
        this.ensure(4);
        buffer.writei32(scratch, this.offset, num);
        this.offset += 4;
    }
    public varint(num: number) {
        const zigzag = (num << 1) ^ (num >> 31);
        let n = zigzag;

        while (true) {
            const byte = n & 0x7f;
            n >>>= 7;
            if (n === 0) {
                this.ensure(1);
                buffer.writeu8(scratch, this.offset, byte);
                this.offset += 1;
                break;
            }
            this.ensure(1);
            buffer.writeu8(scratch, this.offset, byte | 0x80);
            this.offset += 1;
        }
    }

    public f32(num: number) {
        this.ensure(4);
        buffer.writef32(scratch, this.offset, num);
        this.offset += 4;
    }
    public f64(num: number) {
        this.ensure(8);
        buffer.writef64(scratch, this.offset, num);
        this.offset += 8;
    }

    public bool(bool: boolean) {
        this.u8(bool ? 1 : 0);
    }

    public string(str: string) {
        const len = str.size();
        this.varuint(len);

        this.ensure(len);
        buffer.writestring(scratch, this.offset, str, len);
        this.offset += len;
    }

    public flush(): buffer {
        const out = buffer.create(this.offset);
        buffer.copy(out, 0, scratch, 0, this.offset);
        this.offset = 0;
        return out;
    }
}
