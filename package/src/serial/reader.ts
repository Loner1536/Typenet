export default class Reader {
    buf: buffer;
    cursor = 0;

    constructor(buf: buffer) {
        this.buf = buf;
    }

    reset(buf: buffer) {
        this.buf = buf;
        this.cursor = 0;
    }

    u8() {
        const v = buffer.readu8(this.buf, this.cursor);
        this.cursor += 1;
        return v;
    }
    u16() {
        const v = buffer.readu16(this.buf, this.cursor);
        this.cursor += 2;
        return v;
    }
    u32() {
        const v = buffer.readu32(this.buf, this.cursor);
        this.cursor += 4;
        return v;
    }
    i8() {
        const v = buffer.readi8(this.buf, this.cursor);
        this.cursor += 1;
        return v;
    }
    i16() {
        const v = buffer.readi16(this.buf, this.cursor);
        this.cursor += 2;
        return v;
    }
    i32() {
        const v = buffer.readi32(this.buf, this.cursor);
        this.cursor += 4;
        return v;
    }
    f32() {
        const v = buffer.readf32(this.buf, this.cursor);
        this.cursor += 4;
        return v;
    }
    f64() {
        const v = buffer.readf64(this.buf, this.cursor);
        this.cursor += 8;
        return v;
    }

    string() {
        const len = this.u8();
        const v = buffer.readstring(this.buf, this.cursor, len);
        this.cursor += len;
        return v;
    }
}
