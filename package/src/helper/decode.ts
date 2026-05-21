// Content
import * as Types from "../types";

export default function decode(raw: string): Types.Data {
	const result: Types.Data = {};

	raw.split(" ").forEach((pair) => {
		const eqPos = pair.find("=")[0] as number | undefined;
		if (eqPos === undefined) return;

		const key = pair.sub(1, eqPos - 1);
		const val = pair.sub(eqPos + 1);

		const num = tonumber(val);
		result[key] = num !== undefined ? num : val;
	});

	return result;
}
