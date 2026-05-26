export default class Writer {
    buf: buffer;
    cursor = 0;

    constructor(size = 512) {
        this.buf = buffer.create(size);
    }

    private ensure(bytes: number) {
        const needed = this.cursor + bytes;
        if (needed <= buffer.len(this.buf)) return;

        let size = buffer.len(this.buf) * 2;
        while (size < needed) size *= 2;

        const grown = buffer.create(size);
        buffer.copy(grown, 0, this.buf, 0, this.cursor);
        this.buf = grown;
    }

    reset() {
        this.cursor = 0;
    }

    u8(value: number) {
        this.ensure(1);
        buffer.writeu8(this.buf, this.cursor, value);
        this.cursor += 1;
    }
    u16(value: number) {
        this.ensure(2);
        buffer.writeu16(this.buf, this.cursor, value);
        this.cursor += 2;
    }
    u32(value: number) {
        this.ensure(4);
        buffer.writeu32(this.buf, this.cursor, value);
        this.cursor += 4;
    }
    i8(value: number) {
        this.ensure(1);
        buffer.writei8(this.buf, this.cursor, value);
        this.cursor += 1;
    }
    i16(value: number) {
        this.ensure(2);
        buffer.writei16(this.buf, this.cursor, value);
        this.cursor += 2;
    }
    i32(value: number) {
        this.ensure(4);
        buffer.writei32(this.buf, this.cursor, value);
        this.cursor += 4;
    }
    f32(value: number) {
        this.ensure(4);
        buffer.writef32(this.buf, this.cursor, value);
        this.cursor += 4;
    }
    f64(value: number) {
        this.ensure(8);
        buffer.writef64(this.buf, this.cursor, value);
        this.cursor += 8;
    }

    string(value: string) {
        const len = value.size();
        this.u8(len);
        buffer.writestring(this.buf, this.cursor, value);
        this.cursor += len;
    }

    toBuffer(): buffer {
        const out = buffer.create(this.cursor);
        buffer.copy(out, 0, this.buf, 0, this.cursor);
        return out;
    }
}
