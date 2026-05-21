// Services
import { Workspace } from "@rbxts/services";

// Packages
import { source } from "@rbxts/vide";

// Helpers
import useEventListener from "./useEventListener";

/** Default reference resolution for px calculations */
const BASE_RESOLUTION = source(new Vector2(1920, 1080));

/** Minimum allowed scale to prevent unreadable UI */
const MIN_SCALE = source(0.5);

/** 0 = width-based, 1 = height-based */
const DOMINANT_AXIS = 0.5;

const TARGET = source<GuiObject | Camera | undefined>(Workspace.CurrentCamera);
const SCALE = source(1);

let INITIALIZED = false;

function callable<T extends Callback, U>(callback: T, object: U): T & U {
	return setmetatable(object as never, {
		__call: (_, ...args) => callback(...args),
	});
}

export const screen = source(new Vector2(0, 0));
export const px = callable((value: number) => math.round(value * SCALE()), {
	scale: (value: number) => value * SCALE(),
	even: (value: number) => math.round(value * SCALE() * 0.5) * 2,
	floor: (value: number) => math.floor(value * SCALE()),
	ceil: (value: number) => math.ceil(value * SCALE()),
});

function calculateScale() {
	const target = TARGET();
	if (!target) return screen(new Vector2(0, 0));

	if (target.IsA("Camera")) screen(target.ViewportSize);
	else if (target.IsA("GuiObject")) screen(target.AbsoluteSize);

	const size = target.IsA("Camera")
		? target.ViewportSize
		: target.IsA("GuiObject")
			? target.AbsoluteSize
			: undefined;

	if (!size) return;

	const res = BASE_RESOLUTION();
	if (res.X <= 0 || res.Y <= 0) return;

	const min = MIN_SCALE();

	const width = math.log(size.X / res.X, 2);
	const height = math.log(size.Y / res.Y, 2);

	const centered = width + (height - width) * DOMINANT_AXIS;
	const scale = 2 ** centered;

	SCALE(math.max(scale, min));
}

/**
 * Initializes global px scaling.
 * Must be called exactly once.
 */
export function usePx(target?: GuiObject | Camera, baseResolution?: Vector2, minScale?: number) {
	if (INITIALIZED) return warn("usePx() called more than once");

	INITIALIZED = true;

	if (baseResolution) BASE_RESOLUTION(baseResolution);
	if (minScale) MIN_SCALE(minScale);
	if (target) TARGET(target);

	const resolvedTarget = TARGET();
	if (!resolvedTarget) return warn("usePx(): no valid target to observe");

	const signal = resolvedTarget.IsA("Camera")
		? resolvedTarget.GetPropertyChangedSignal("ViewportSize")
		: resolvedTarget.GetPropertyChangedSignal("AbsoluteSize");

	useEventListener(signal, calculateScale);
	calculateScale();
}
