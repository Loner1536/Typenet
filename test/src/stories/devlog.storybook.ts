// Types
import { type Storybook } from "@rbxts/ui-labs";

const storybook: Storybook = {
	name: "Devlog",
	storyRoots: [script.Parent!.FindFirstChild("devlog")! as Folder],
};

export = storybook;
