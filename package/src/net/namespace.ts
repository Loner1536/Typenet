// Package
import Object from "@rbxts/object-utils";

// Types
import * as Types from "../types";

// Net
import { createFunction, NetFunction } from "./function";
import { createEvent, NetEvent } from "./event";

type EventDef<T> = { _kind: "event"; config: Types.EventConfig<T> };
type FuncDef<TReq, TRes> = { _kind: "func"; config: Types.FunctionConfig<TReq, TRes> };

/** A record of event and function definitions used to define a namespace's shape. */
export type NamespaceDef = Record<string, EventDef<unknown> | FuncDef<unknown, unknown>>;

/** Resolves a `NamespaceDef` into its corresponding `NetEvent` and `NetFunction` instances. */
type ResolveNamespace<Def extends NamespaceDef> = {
	[K in keyof Def]: Def[K] extends EventDef<infer T>
		? NetEvent<T>
		: Def[K] extends FuncDef<infer TReq, infer TRes>
			? NetFunction<TReq, TRes>
			: never;
};

/**
 * Defines a networked event entry for use inside `createNamespace`.
 *
 * @param config - The event configuration, including an optional data codec.
 *
 * @example
 * defineEvent({ data: t.str(64) })
 */
export function defineEvent<T>(config: Types.EventConfig<T>): EventDef<T> {
	return { _kind: "event", config };
}

/**
 * Defines a networked function entry for use inside `createNamespace`.
 *
 * @param config - The function configuration, including optional request and response codecs.
 *
 * @example
 * defineFunc({ request: t.str(64), response: t.u32 })
 */
export function defineFunc<TReq, TRes>(
	config: Types.FunctionConfig<TReq, TRes>,
): FuncDef<TReq, TRes> {
	return { _kind: "func", config };
}

/**
 * Groups a set of events and functions under a shared namespace prefix.
 * Each key in `def` becomes a `NetEvent` or `NetFunction` on the returned object.
 *
 * @param namespaceName - The shared prefix used to identify all members of this namespace.
 * @param def - A record of `defineEvent` and `defineFunc` entries.
 *
 * @example
 * const PlayerNet = createNamespace("Player", {
 *     Died: defineEvent({ data: t.str(64) }),
 *     GetScore: defineFunc({ request: t.str(64), response: t.u32 }),
 * });
 *
 * PlayerNet.Died.fireServer(data);
 * const score = await PlayerNet.GetScore.invoke("hello");
 */
export function createNamespace<Def extends NamespaceDef>(
	namespaceName: string,
	def: Def,
): ResolveNamespace<Def> {
	const out = {} as ResolveNamespace<Def>;

	for (const [key, value] of Object.entries(def) as Array<
		[string, EventDef<unknown> | FuncDef<unknown, unknown>]
	>) {
		if (value._kind === "event") {
			(out as Record<string, unknown>)[key] = createEvent(
				namespaceName,
				key,
				value.config as Types.EventConfig<unknown>,
			);
		} else if (value._kind === "func") {
			(out as Record<string, unknown>)[key] = createFunction(
				namespaceName,
				key,
				value.config as Types.FunctionConfig<unknown, unknown>,
			);
		}
	}

	return out;
}
