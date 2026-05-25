// Package
import { Channel, Packet, t } from "@rbxts/typenet";
import Lync from "@rbxts/lync";

const Network = {
    Typenet: Channel("Test", {
        unknown: Packet(t.none),
    }),
    Lync: {
        unkown: Lync.packet("Test", Lync.unknown),
    },
};

export default Network;
