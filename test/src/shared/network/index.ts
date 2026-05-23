// Package
import Lync from "@rbxts/lync";

Lync.configure({ stats: true, channelMaxSize: 1048576 });

const Network = {
	Net: {},
	Lync: {
		BoolArray: Lync.packet("BenchBoolArray", Lync.array(Lync.bool)),
		Bool: Lync.packet("BenchBool", Lync.bool),
		StructArray: Lync.packet(
			"BenchStructArray",
			Lync.array(
				Lync.struct({
					id: Lync.int(0, 255),
					x: Lync.int(0, 255),
					y: Lync.int(0, 255),
					z: Lync.int(0, 255),
					orientation: Lync.int(0, 255),
					animation: Lync.int(0, 255),
				}),
			),
		),
		Str: Lync.packet("BenchStr", Lync.string(32)),
	},
};

export default Network;
