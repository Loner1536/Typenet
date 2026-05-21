// Package
import { RunService } from "@rbxts/services";

// Types
import * as Types from "../types";

// Transport
import { registerServerHandler, registerClientHandler, wrapDirect } from "../transport/bridge";
import { writeToPlayer, writeToPlayerDirect } from "../transport/server";
import { writeToServer, writeToServerDirect } from "../transport/client";
import { createReader } from "../transport/reader";

// Net
import { _isMeasuring, _reportMeasuredBytes } from "./measure";
import { register } from "./registry";

/**
 * Represents a networked event that can fire data between server and client.
 * Methods are only available on the correct context — `fireServer` on the client,
 * `fireClient` on the server.
 *
 * @example
 * const myEvent: NetEvent<string> = createEvent("MyNamespace", "MyEvent", { data: t.str });
 */
export type NetEvent<T> = {
	/**
	 * Fires the event from the client to the server.
	 * Only callable on the client.
	 *
	 * @example
	 * myEvent.fireServer("hello");
	 */
	fireServer: (data: T) => void;

	/**
	 * Fires the event from the server to a specific client.
	 * Only callable on the server.
	 *
	 * @example
	 * myEvent.fireClient(player, "hello");
	 */
	fireClient: (player: Player, data: T) => void;

	/**
	 * Registers a handler to be called when this event is received.
	 * On the server, the handler receives the sender as the second argument.
	 *
	 * @example
	 * myEvent.on((data, player) => print(player, data)); // server
	 * myEvent.on((data) => print(data));                 // client
	 */
	on(handler: (data: T, player?: Player) => void): void;

	/**
	 * The codec used to encode and decode this event's data.
	 * `undefined` if the event carries no data.
	 */
	readonly codec: Types.Codec<T> | undefined;
};

/**
 * Creates a networked event bound to a namespace and name.
 * Encodes outgoing data into a buffer using the provided codec,
 * and decodes incoming buffers back into the typed value.
 *
 * @param namespaceName - The namespace this event belongs to.
 * @param eventName - The unique name of this event within the namespace.
 * @param config - Event configuration, including an optional data codec.
 *
 * @example
 * const myEvent = createEvent("MyNamespace", "MyEvent", { data: t.str(64) });
 * myEvent.fireServer("hello");
 * myEvent.on((data, player) => print(player?.Name, data));
 */
export function createEvent<T>(
	namespaceName: string,
	eventName: string,
	config: Types.EventConfig<T>,
): NetEvent<T> {
	const batched = config.batch !== false;
	const remoteId = register(namespaceName, eventName, "event");
	const codec = config.data as unknown as Types.InternalCodec<T> | undefined;

	function encodeAndSend(data: T, player?: Player): void {
		if (_isMeasuring()) {
			_reportMeasuredBytes(codec !== undefined ? codec.measure(data) : 0);
		}

		const size = codec !== undefined ? codec.measure(data) : 0;
		const payload = buffer.create(size);
		if (codec !== undefined) codec.encode(payload, 0, data);

		if (player !== undefined) {
			if (batched) {
				writeToPlayer(player, remoteId, payload);
			} else {
				writeToPlayerDirect(player, wrapDirect(remoteId, payload));
			}
		} else {
			if (batched) {
				writeToServer(remoteId, payload);
			} else {
				writeToServerDirect(wrapDirect(remoteId, wrapDirect(remoteId, payload)));
			}
		}
	}

	return {
		fireServer: (!RunService.IsServer()
			? (data: T) => encodeAndSend(data)
			: undefined) as NetEvent<T>["fireServer"],

		fireClient: (RunService.IsServer()
			? (player: Player, data: T) => encodeAndSend(data, player)
			: undefined) as NetEvent<T>["fireClient"],

		on(handler: (data: T, player?: Player) => void): void {
			if (RunService.IsServer()) {
				registerServerHandler(remoteId, (player, payload) => {
					const data =
						codec !== undefined ? codec.decode(createReader(payload)) : (undefined as unknown as T);
					handler(data, player);
				});
			} else {
				registerClientHandler(remoteId, (payload) => {
					const data =
						codec !== undefined ? codec.decode(createReader(payload)) : (undefined as unknown as T);
					handler(data);
				});
			}
		},
		codec,
	} as NetEvent<T>;
}
