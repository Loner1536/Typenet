// Packages
import Object from "@rbxts/object-utils";

// Content
import * as Types from "../types";

export default function format(data: Types.Data): string {
	return Object.entries(data)
		.map(([key, value]) => `${key}=${value}`)
		.join(" ");
}
