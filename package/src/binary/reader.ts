//!optimize 2
//!native

export default class Reader {
    private offset = 0;

    constructor(private buf: buffer) { }

    public ensure(bytes: number) {
        if (this.offset + bytes > buffer.len(this.buf)) {
            error(`[Reader] Overflow: tried to read ${bytes}B at offset ${this.offset}`);
        }
    }

    public u8(): number {
        this.ensure(1);
        const val = buffer.readu8(this.buf, this.offset);
        this.offset += 1;
        return val;
    }
    public u16(): number {
        this.ensure(2);
        const val = buffer.readu16(this.buf, this.offset);
        this.offset += 2;
        return val;
    }
    public u32(): number {
        this.ensure(4);
        const val = buffer.readu32(this.buf, this.offset);
        this.offset += 4;
        return val;
    }
    public varuint(): number {
        let result = 0;
        let shift = 0;
        while (true) {
            this.ensure(1);
            const byte = buffer.readu8(this.buf, this.offset);
            this.offset += 1;
            result |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
        }
        return result;
    }

    public i8(): number {
        this.ensure(1);
        const val = buffer.readi8(this.buf, this.offset);
        this.offset += 1;
        return val;
    }
    public i16(): number {
        this.ensure(2);
        const val = buffer.readi16(this.buf, this.offset);
        this.offset += 2;
        return val;
    }
    public i32(): number {
        this.ensure(4);
        const val = buffer.readi32(this.buf, this.offset);
        this.offset += 4;
        return val;
    }
    public varint(): number {
        const zigzag = this.varuint();
        return (zigzag >>> 1) ^ -(zigzag & 1);
    }

    public f32(): number {
        this.ensure(4);
        const val = buffer.readf32(this.buf, this.offset);
        this.offset += 4;
        return val;
    }
    public f64(): number {
        this.ensure(8);
        const val = buffer.readf64(this.buf, this.offset);
        this.offset += 8;
        return val;
    }

    public bool(): boolean {
        return this.u8() === 1;
    }

    public string(): string {
        const len = this.varuint();
        this.ensure(len);
        const val = buffer.readstring(this.buf, this.offset, len);
        this.offset += len;
        return val;
    }
}
