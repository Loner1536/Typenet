// Package
import { Channel, Packet, t } from "@rbxts/typenet";
import Lync from "@rbxts/lync";

const Network = {
    Typenet: Channel("Test", {
        unknown: Packet(t.unknown),
        string: Packet(t.string),

        u8: Packet(t.u8),
    }),
    Lync: {
        unknown: Lync.packet("Unknown", Lync.unknown),
        string: Lync.packet("String", Lync.string),

        u8: Lync.packet("u8", Lync.int(0, 255)),
    },
};

export default Network;
