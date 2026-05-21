// Package
import { ReplicatedStorage } from "@rbxts/services";
import Lync from "@rbxts/lync";
import Net from "@rbxts/net";

// Shared
import type { ReceivedMap } from "@shared/benches";
import Network from "@shared/network";

Lync.start();
Net.start();

Network.Net.Test.response((_player, str) => {
	print(str);
});

Network.Lync.Test.handle((str, _player) => {
	print(str);
});

const received: ReceivedMap = {
	"bool[]": { Net: 0, Lync: 0 },
	bool: { Net: 0, Lync: 0 },
	"struct[]": { Net: 0, Lync: 0 },
	string: { Net: 0, Lync: 0 },
};

Network.Net.BoolArray.on(() => {
	received["bool[]"].Net += 1;
});
Network.Net.Bool.on(() => {
	received["bool"].Net += 1;
});
Network.Net.StructArray.on(() => {
	received["struct[]"].Net += 1;
});
Network.Net.Str.on(() => {
	received["string"].Net += 1;
});

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
