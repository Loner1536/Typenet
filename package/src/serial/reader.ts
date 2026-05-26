export default class Reader {
    buf: buffer;
    offset = 0;

    constructor(buf: buffer) {
        this.buf = buf;
    }

    reset(buf: buffer) {
        this.buf = buf;
        this.offset = 0;
    }

    u8() {
        const v = buffer.readu8(this.buf, this.offset);
        this.offset += 1;
        return v;
    }
    u16() {
        const v = buffer.readu16(this.buf, this.offset);
        this.offset += 2;
        return v;
    }
    u32() {
        const v = buffer.readu32(this.buf, this.offset);
        this.offset += 4;
        return v;
    }
    i8() {
        const v = buffer.readi8(this.buf, this.offset);
        this.offset += 1;
        return v;
    }
    i16() {
        const v = buffer.readi16(this.buf, this.offset);
        this.offset += 2;
        return v;
    }
    i32() {
        const v = buffer.readi32(this.buf, this.offset);
        this.offset += 4;
        return v;
    }
    f32() {
        const v = buffer.readf32(this.buf, this.offset);
        this.offset += 4;
        return v;
    }
    f64() {
        const v = buffer.readf64(this.buf, this.offset);
        this.offset += 8;
        return v;
    }

    string() {
        const len = this.u16();
        const v = buffer.readstring(this.buf, this.offset, len);
        this.offset += len;
        return v;
    }
}
