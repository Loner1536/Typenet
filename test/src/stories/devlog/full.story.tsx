// Package
import { CreateVideStory, type InferVideProps } from "@rbxts/ui-labs";
import { CreateDevlog } from "@rbxts/devlog";
import Vide from "@rbxts/vide";

const controls = {};

const story = CreateVideStory(
	{
		vide: Vide,
		controls,
	},
	(props: InferVideProps<typeof controls>) => {
		const Lens = new CreateDevlog({
			manual: true,

			px: {
				target: props.target,
			},
		});

		Lens.info("test.ping", { latency: 42, status: "ok" }, 0);
		Lens.info("test.player", { name: "Player1", health: 100 }, 0);

		let tick = 0;
		let entryCount = 0;

		task.spawn(() => {
			while (true) {
				task.wait(2);
				tick++;
				entryCount++;

				Lens.info(`entry.${entryCount}`, { id: entryCount, tick }, 3, "top_left");

				if (tick % 2 === 0) {
					entryCount++;
					Lens.info(`long.${entryCount}`, { id: entryCount, persists: "yes" }, 8, "top_left");
				}
			}
		});

		Lens.startInternalPx();

		return Lens.cornerFrames;
	},
);

export = story;
