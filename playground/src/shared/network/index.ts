// Package
import { Channel, Packet, Query, t } from "@rbxts/typenet";
import Lync from "@rbxts/lync";

const Network = {
    Typenet: Channel("Test", {
        unknown: Packet(t.unknown),
        string: Packet(t.string),

        u8: Packet(t.u8),
        u16: Packet(t.u16),
        u32: Packet(t.u32),

        i8: Packet(t.i8),
        i16: Packet(t.i16),
        i32: Packet(t.i32),

        f32: Packet(t.f32),
        f64: Packet(t.f64),

        query: Query(t.string),
    }),
    Lync: {
        unknown: Lync.packet("Unknown", Lync.unknown),
        string: Lync.packet("String", Lync.string),

        u8: Lync.packet("u8", Lync.int(0, 0xff)),
        u16: Lync.packet("u16", Lync.int(0, 0xffff)),
        u32: Lync.packet("u32", Lync.int(0, 0xffffff)),

        i8: Lync.packet("i8", Lync.int(-0x80, 0x7f)),
        i16: Lync.packet("i16", Lync.int(-0x8000, 0x7fff)),
        i32: Lync.packet("i32", Lync.int(-0x80000000, 0x7fffffff)),

        f16: Lync.packet("f16", Lync.f16),
        f32: Lync.packet("f32", Lync.f32),
        f64: Lync.packet("f64", Lync.f64),
    },
};

export default Network;
