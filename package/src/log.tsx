// Packages
import Vide, { mount, source } from "@rbxts/vide";
import { HttpService, Players, RunService } from "@rbxts/services";

// Types
import * as Types from "./types";

// Hook
import { px, usePx } from "./hook/usePx";

// Helper
import decode from "./helper/decode";

// Content
import Network from "./network";

// Entry
import Container from "./container";

export default class DevLog {
	public readonly default_corner_settings: Types.DevLogEntry["corners"] = {
		info: {
			color: Color3.fromRGB(200, 150, 0),
			order: 1,
		},
	};

	public screenGui: Vide.Node;
	public cornerFrames: Vide.Node[] = [];

	private _px: boolean = false;

	private top_left_entries!: Vide.Source<Types.CornerEntry[]>;
	private top_right_entries!: Vide.Source<Types.CornerEntry[]>;
	private bottom_left_entries!: Vide.Source<Types.CornerEntry[]>;
	private bottom_right_entries!: Vide.Source<Types.CornerEntry[]>;

	constructor(private entry?: Types.DevLogEntry) {
		if (RunService.IsServer() && RunService.IsRunning()) {
			Network.ServerError.send(undefined);
			return;
		}

		if (entry?.manual) {
			print("Created Devlog Via Manual");

			this.containers();
		} else {
			print("Created Devlog Via Auto");
			mount(() => {
				if (!this._px) usePx(entry?.px?.target, entry?.px?.baseResolution, entry?.px?.minScale);
				this._px = true;

				return this.containers();
			}, entry?.target ?? Players.LocalPlayer.FindFirstChild("PlayerGui"));
		}

		Network.Info.on((entry) =>
			this.info(entry.label, decode(entry.data), entry.time ?? 5, "bottom_right", true),
		);
		Network.ServerError.on(() =>
			this.info("server.error", { value: `"Tried creating Devlog via Server!"` }),
		);
	}

	private containers() {
		this.top_left_entries = source<Types.CornerEntry[]>([]);
		this.top_right_entries = source<Types.CornerEntry[]>([]);
		this.bottom_left_entries = source<Types.CornerEntry[]>([]);
		this.bottom_right_entries = source<Types.CornerEntry[]>([]);

		const corners = {
			top_left: (
				<frame
					Name={"Top-Left"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0, 0)}
					Position={() => new UDim2(0, px(10), 0, px(10))}
					Size={UDim2.fromScale(0.475, 0.475)}
				>
					<uilistlayout
						Padding={() => new UDim(0, px(7.5))}
						VerticalAlignment={"Top"}
						HorizontalAlignment={"Left"}
						FillDirection={"Vertical"}
					/>

					<Container src={this.top_left_entries} y={"top"} x={"left"} />
				</frame>
			),
			top_right: (
				<frame
					Name={"Top-Right"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(1, 0)}
					Position={() => new UDim2(1, -px(10), 0, px(10))}
					Size={UDim2.fromScale(0.475, 0.475)}
				>
					<uilistlayout
						Padding={() => new UDim(0, px(7.5))}
						VerticalAlignment={"Top"}
						HorizontalAlignment={"Right"}
						FillDirection={"Vertical"}
					/>

					<Container src={this.top_right_entries} y={"top"} x={"right"} />
				</frame>
			),
			bottom_left: (
				<frame
					Name={"Bottom-Left"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(0, 1)}
					Position={() => new UDim2(0, px(10), 1, -px(10))}
					Size={UDim2.fromScale(0.475, 0.475)}
				>
					<uilistlayout
						Padding={() => new UDim(0, px(7.5))}
						VerticalAlignment={"Bottom"}
						HorizontalAlignment={"Left"}
						FillDirection={"Vertical"}
					/>

					<Container src={this.bottom_left_entries} y={"bottom"} x={"left"} />
				</frame>
			),
			bottom_right: (
				<frame
					Name={"Bottom-Right"}
					BackgroundTransparency={1}
					AnchorPoint={new Vector2(1, 1)}
					Position={() => new UDim2(1, -px(10), 1, -px(10))}
					Size={UDim2.fromScale(0.475, 0.475)}
				>
					<uilistlayout
						Padding={() => new UDim(0, px(7.5))}
						VerticalAlignment={"Bottom"}
						HorizontalAlignment={"Right"}
						FillDirection={"Vertical"}
					/>

					<Container src={this.bottom_right_entries} y={"bottom"} x={"right"} />
				</frame>
			),
		};

		this.cornerFrames = [
			corners.top_left,
			corners.top_right,
			corners.bottom_left,
			corners.bottom_right,
		];

		this.screenGui = (
			<screengui Name={"DevLog"} ResetOnSpawn={false} IgnoreGuiInset>
				{this.cornerFrames}
			</screengui>
		);

		return this.screenGui;
	}

	private set(
		corner: Types.TypeEntry["corner"],
		label: string,
		data: Record<string, unknown>,
		time: number = 0,
		server: boolean = false,
	) {
		const tag = server ? "server" : "client";
		const id = HttpService.GenerateGUID(false);
		const entry: Types.CornerEntry = { type: "INFO", label, data, time, tag, id };

		const src =
			corner === "top_left"
				? this.top_left_entries
				: corner === "top_right"
					? this.top_right_entries
					: corner === "bottom_left"
						? this.bottom_left_entries
						: this.bottom_right_entries;

		src([...src(), entry]);

		if (time > 0) {
			task.delay(time, () => {
				src(src().filter((e) => e.id !== id));
			});
		}
	}

	public info(
		label: string,
		data: Record<string, unknown>,
		time: number = 0,
		corner: Types.TypeEntry["corner"] = "top_right",
		server: boolean = false,
	) {
		this.set(corner, label, data, time, server);
	}

	public startInternalPx() {
		warn("This is mainly used for instances like UILabs");

		usePx(this.entry?.px?.target, this.entry?.px?.baseResolution, this.entry?.px?.minScale);
	}
}
