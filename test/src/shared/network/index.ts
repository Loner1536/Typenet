// Package
import Net, { t } from "@rbxts/net";
import Lync from "@rbxts/lync";

Lync.configure({ stats: true, channelMaxSize: 1048576 });

const Network = {
	Net: Net.namespace("Bench", {
		BoolArray: Net.event({ data: t.array(t.bool) }),
		Bool: Net.event({ data: t.bool }),
		StructArray: Net.event({
			data: t.array(
				t.struct({
					id: t.u8,
					x: t.u8,
					y: t.u8,
					z: t.u8,
					orientation: t.u8,
					animation: t.u8,
				}),
			),
		}),
		Str: Net.event({ data: t.string(32) }),

		Test: Net.func({ request: t.string, batch: true }),
	}),
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

		Test: Lync.query("Test", Lync.string, Lync.nothing),
	},
};

export default Network;
