// Packages
import { cleanup } from "@rbxts/vide";

type EventLike<T extends Callback = Callback> =
	| { Connect(callback: T): ConnectionLike }
	| { connect(callback: T): ConnectionLike }
	| { subscribe(callback: T): ConnectionLike };

type ConnectionLike = { Disconnect(): void } | { disconnect(): void } | (() => void);

const connect = (event: EventLike, callback: Callback): ConnectionLike => {
	if (typeIs(event, "RBXScriptSignal")) {
		const connection = event.Connect((...args: unknown[]) => {
			if (connection.Connected) {
				return callback(...args);
			}
		});
		return connection;
	} else if ("Connect" in event) {
		return event.Connect(callback);
	} else if ("connect" in event) {
		return event.connect(callback);
	} else if ("subscribe" in event) {
		return event.subscribe(callback);
	} else {
		throw "Event-like object does not have a supported connect method.";
	}
};

const disconnect = (connection: ConnectionLike) => {
	if (typeIs(connection, "function")) {
		connection();
	} else if (typeIs(connection, "RBXScriptConnection") || "Disconnect" in connection) {
		connection.Disconnect();
	} else if ("disconnect" in connection) {
		connection.disconnect();
	} else {
		throw "Connection-like object does not have a supported disconnect method.";
	}
};

/**
 * Subscribes to an event-like object. The subscription is automatically
 * disconnected when the scope cleans up.
 *
 * @param event The event-like object to subscribe to.
 * @param listener The listener to subscribe with.
 * @returns The connection object.
 */
export default function useEventListener<T extends EventLike>(
	event: T,
	listener: T extends EventLike<infer U> ? U : never,
): ReturnType<T> {
	const connection = connect(event, listener);

	cleanup(() => disconnect(connection));
	return connection as ReturnType<T>;
}
