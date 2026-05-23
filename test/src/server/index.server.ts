// Package
import { Players, ReplicatedStorage } from "@rbxts/services";
import Lync from "@rbxts/lync";

// Shared
import type { ReceivedMap } from "@shared/benches";
import Network from "@shared/network";
import State from "@shared/state";

Lync.start();

// Network.Net.Query.Test.response((_player, str) => print(str));

// Network.Lync.Test.handle((str, _player) => {
// 	print(str);
// });

Players.PlayerAdded.Connect((player) => {
	State.Player.set(player, { clicks: 0, test: 1 });

	task.delay(4, () => {
		State.Player.update(player, (data) => {
			return {
				...data,
				clicks: 1,
			};
		});
	});
});

Players.PlayerRemoving.Connect((player) => {
	State.Player.remove(player);
});

const received: ReceivedMap = {
	"bool[]": { Net: 0, Lync: 0 },
	bool: { Net: 0, Lync: 0 },
	"struct[]": { Net: 0, Lync: 0 },
	string: { Net: 0, Lync: 0 },
};

// Network.Net.Bench.BoolArray.on(() => {
// 	received["bool[]"].Net += 1;
// });
// Network.Net.Bench.Bool.on(() => {
// 	received["bool"].Net += 1;
// });
// Network.Net.Bench.StructArray.on(() => {
// 	received["struct[]"].Net += 1;
// });
// Network.Net.Bench.Str.on(() => {
// 	received["string"].Net += 1;
// });

Network.Lync.BoolArray.on(() => {
	received["bool[]"].Lync += 1;
});
Network.Lync.Bool.on(() => {
	received["bool"].Lync += 1;
});
Network.Lync.StructArray.on(() => {
	received["struct[]"].Lync += 1;
});
Network.Lync.Str.on(() => {
	received["string"].Lync += 1;
});

const GetReceived = ReplicatedStorage.WaitForChild("GetReceived") as RemoteFunction;
GetReceived.OnServerInvoke = () => received;
