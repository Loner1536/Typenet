// Package
import { Channel, Packet, t } from "@rbxts/typenet";
import Lync from "@rbxts/lync";

const Network = {
    Typenet: Channel("Test", {
        unknown: Packet(t.unknown),
        string: Packet(t.string),
    }),
    Lync: {
        unknown: Lync.packet("Unknown", Lync.unknown),
        string: Lync.packet("String", Lync.string),
    },
};

export default Network;
