export default class Writer {
    private buf: buffer;
    private offset = 0;

    constructor(size: number = 512) {
        this.buf = buffer.create(size);
    }

    u8(value: number) {
        buffer.writeu8(this.buf, this.offset, value);
        this.offset++;
    }
    u16(value: number) {
        buffer.writeu16(this.buf, this.offset, value);
        this.offset += 2;
    }
    u32(value: number) {
        buffer.writeu32(this.buf, this.offset, value);
        this.offset += 4;
    }

    i8(value: number) {
        buffer.writei8(this.buf, this.offset, value);
        this.offset++;
    }
    i16(value: number) {
        buffer.writei16(this.buf, this.offset, value);
        this.offset += 2;
    }
    i32(value: number) {
        buffer.writei32(this.buf, this.offset, value);
        this.offset += 4;
    }

    f32(value: number) {
        buffer.writef32(this.buf, this.offset, value);
        this.offset += 4;
    }
    f64(value: number) {
        buffer.writef64(this.buf, this.offset, value);
        this.offset += 8;
    }

    string(value: string) {
        this.u16(value.size());

        buffer.writestring(this.buf, this.offset, value, value.size());
        this.offset += value.size();
    }

    toBuffer(): buffer {
        const out = buffer.create(this.offset);
        buffer.copy(out, 0, this.buf, 0, this.offset);

        return out;
    }
}
