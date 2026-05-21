// Packages
import { StarterGui } from "@rbxts/services";
import { CreateDevlog } from "@rbxts/devlog";
import { Flamework } from "@flamework/core";
import Lync from "@rbxts/lync";

StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Health, false);

// Flamework.addPaths("src/client/controller");

Flamework.ignite();
Lync.start();

const Lens = new CreateDevlog({
	corners: {
		info: {
			color: Color3.fromRGB(75, 250, 255),
		},
	},
});

Lens.info(
	"test.test",
	{
		test: 0,
	},
	3,
);
