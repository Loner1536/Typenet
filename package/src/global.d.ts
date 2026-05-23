/** Opaque handle passed to event/function configs. Internal methods are not exposed. */

/** Internal codec interface. Plain object literals satisfy this — no brand required. */
// export interface InternalCodec<T> {
// 	encode(buf: buffer, offset: number, value: T, baseline?: T): void;
// 	decode(reader: Reader, baseline?: T): T;
// 	measure(value: T, baseline?: T): number;
// }

declare namespace Typenet {
	export interface Codec<T> {
		/** @hidden */ readonly _nominal_codec: T;
	}

	export const FOLDER_NAME = "__TYPENET__";
	export const RELIABLE_EVENT = "__RELIABLE_EVENT__";
	export const UNRELIABLE_EVENT = "__UNRELIABLE_EVENT__";
}
