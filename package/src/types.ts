export type TypeEntry = {
	corner?: "top_right" | "top_left" | "bottom_right" | "bottom_left";
	color?: Color3;
	order?: number;
};

export type DevLogEntry = {
	target?: GuiObject;
	manual?: boolean;

	corners?: {
		info?: TypeEntry;
	};

	px?: {
		target?: GuiObject | undefined;
		baseResolution?: Vector2;
		minScale?: number;
	};
};

export type CornerEntry = {
	type: "INFO";
	label: string;
	tag: "client" | "server";
	data: Record<string, unknown>;
	time: number;
	id: string;
};

export type Data = Record<string, unknown>;
