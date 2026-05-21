// Transport
import { Reader } from "./transport/reader";
export { Reader };

/** Opaque handle passed to event/function configs. Internal methods are not exposed. */
export interface Codec<T> {
	/** @hidden */ readonly _nominal_codec: T;
}

/** Internal codec interface. Plain object literals satisfy this — no brand required. */
export interface InternalCodec<T> {
	encode(buf: buffer, offset: number, value: T, baseline?: T): void;
	decode(reader: Reader, baseline?: T): T;
	measure(value: T, baseline?: T): number;
	_delta?: InternalCodec<T>;
}

export type MeasureCallback = (bytes: number) => void;

export type RateLimit = {
	max: number;
	window: number;
	onExceeded?: (player: Player) => void;
};

export type EventConfig<T> = {
	data?: Codec<T>;
	rateLimit?: RateLimit;
	batch?: boolean;
};

export type FunctionConfig<TRequest, TResponse> = {
	request?: Codec<TRequest>;
	response?: Codec<TResponse>;
	batch?: boolean;
};

export type SyncedConfig<T> = {
	data: Codec<T>;
	filter?: (player: Player, data: T) => T;
	onSend?: (player: Player, bytes: number, value: T, baseline: T | undefined) => void;
	onReceive?: (bytes: number, value: T, baseline: T | undefined) => void;
};

export type MeasureResult = {
	label: string;
	bytes: number;
	formatted: string;
};
