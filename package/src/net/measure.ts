// Types
import * as Types from "../types";

let activeCallback: Types.MeasureCallback | undefined;

/**
 * Reports the encoded byte count back to the `measure()` caller when a measurement context is active.
 * @internal
 */
export function _reportMeasuredBytes(bytes: number): void {
	if (activeCallback !== undefined) {
		activeCallback(bytes);
	}
}

/**
 * Returns true when a `Net.measure()` context is currently active.
 * @internal
 */
export function _isMeasuring(): boolean {
	return activeCallback !== undefined;
}

/**
 * Wraps a function in a measurement context. Any `fireServer` or `fireClient` calls
 * inside the callback will report their encoded byte size without sending over the wire.
 *
 * Nested `measure()` calls are not supported and will throw.
 *
 * @param label - A descriptive name included in the result and printed to output.
 * @param fn - The callback in which firing is intercepted for measurement.
 *
 * @example
 * Net.measure("PlayerDied", () => PlayerNet.Died.fireServer(data));
 * // returns { label: "PlayerDied", bytes: 24, formatted: "PlayerDied → 24 bytes" }
 */
export function measure(label: string, fn: () => void): Types.MeasureResult {
	assert(activeCallback === undefined, "[Net] Nested Net.measure() calls are not supported");

	let captured = 0;

	activeCallback = (bytes: number) => {
		captured = bytes;
	};

	const [ok, err] = pcall(fn);

	activeCallback = undefined;

	assert(ok, `[Net] measure() callback threw: ${err}`);

	const formatted = `${label} → ${captured} bytes`;
	print(formatted);

	return { label, bytes: captured, formatted };
}

/**
 * Measures the encoded byte size of a value via its codec directly, without firing anything.
 *
 * @param codec - Any codec that exposes a `measure` method.
 * @param value - The value to measure.
 *
 * @example
 * const bytes = Net.measureDirect(MyEvent.codec!, payload);
 */
export function measureDirect<T>(codec: Types.Codec<T> | undefined, value: T): number {
	if (codec === undefined) return 0;
	return (codec as unknown as Types.InternalCodec<T>).measure(value);
}
