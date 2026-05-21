// Packages
import { Server, FormatData } from "@rbxts/devlog";
import { Flamework } from "@flamework/core";
import { Players } from "@rbxts/services";
import Lync from "@rbxts/lync";

// Flamework.addPaths("src/server/service");

Flamework.ignite();
Lync.start();

task.delay(1, () => {
	Server.Info.send(
		{
			label: "server.stats",
			data: FormatData({
				players: Players.GetPlayers().size(),
				clock: os.clock(),
			}),
			time: undefined,
		},
		Lync.all,
	);
});
