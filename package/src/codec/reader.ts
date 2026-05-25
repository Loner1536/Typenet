export default class Reader {
    public offset = 0;

    constructor(public buf: buffer) { }

    u8(): number {
        const value = buffer.readu8(this.buf, this.offset);
        this.offset += 1;
        return value;
    }
    u16(): number {
        const value = buffer.readu16(this.buf, this.offset);
        this.offset += 2;
        return value;
    }
    u32(): number {
        const value = buffer.readu32(this.buf, this.offset);
        this.offset += 4;
        return value;
    }

    i8(): number {
        const value = buffer.readi8(this.buf, this.offset);
        this.offset += 1;
        return value;
    }
    i16(): number {
        const value = buffer.readi16(this.buf, this.offset);
        this.offset += 2;
        return value;
    }
    i32(): number {
        const value = buffer.readi32(this.buf, this.offset);
        this.offset += 4;
        return value;
    }

    f32(): number {
        const value = buffer.readf32(this.buf, this.offset);
        this.offset += 4;
        return value;
    }
    f64(): number {
        const value = buffer.readf64(this.buf, this.offset);
        this.offset += 8;
        return value;
    }

    string(): string {
        const length = this.u16();
        const value = buffer.readstring(this.buf, this.offset, length);
        this.offset += length;
        return value;
    }
}
