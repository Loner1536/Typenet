// Package
import TypeNet, { t } from "@rbxts/typenet";
import Lync from "@rbxts/lync";

// Shared
import State from "@shared/state";

Lync.configure({ stats: true, channelMaxSize: 1048576 });

const Network = {
	Net: {
		Bench: TypeNet.namespace("Bench", {
			BoolArray: TypeNet.event({ data: t.array(t.bool) }),
			Bool: TypeNet.event({ data: t.bool }),
			StructArray: TypeNet.event({
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
			Str: TypeNet.event({ data: t.string(32) }),
		}),
		Sync: TypeNet.namespace("Sync", {
			Test: TypeNet.sync({
				data: t.deltaMap(
					t.f64,
					t.deltaStruct({
						clicks: t.num(0, 100),
						items: t.deltaArray(t.struct({ test: t.string })),
					}),
				),
				filter: (player, data) => {
					const result = new Map<number, Type.Player.Data>();
					const entry = data.get(player.UserId);
					if (entry !== undefined) result.set(player.UserId, entry);

					return result;
				},
				onSend: (player, bytes, value, baseline) => {
					print(`[sync] → ${player.Name}  ${bytes}bytes delta=${baseline !== undefined}`, value);
				},
				onReceive: (bytes, value) => {
					print(`[sync] ← ${bytes}bytes`, value);
				},
			}),
		}),
		Query: TypeNet.namespace("Query", {
			Test: TypeNet.func({ request: t.string }),
		}),
	},
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

Network.Net.Sync.Test.bind(State.Player.atom);

export default Network;
