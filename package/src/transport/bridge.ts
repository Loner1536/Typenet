/** Handles an incoming payload on the server, given the sending player. */
export type ServerHandler = (player: Player, payload: buffer) => void;

/** Handles an incoming payload on the client. */
export type ClientHandler = (payload: buffer) => void;

const serverHandlers = new Map<number, ServerHandler>();
const clientHandlers = new Map<number, ClientHandler>();

/**
 * Registers a server-side handler for a given remote ID.
 * Throws if a handler is already registered for that ID.
 *
 * @param remoteId - The u16 remote ID assigned at registration.
 * @param handler - Called with the sending player and raw payload buffer when a frame arrives.
 */
export function registerServerHandler(remoteId: number, handler: ServerHandler): void {
	assert(
		!serverHandlers.has(remoteId),
		`[Net/bridge] Server handler already registered for remote id ${remoteId}`,
	);
	serverHandlers.set(remoteId, handler);
}

/**
 * Registers a client-side handler for a given remote ID.
 * Throws if a handler is already registered for that ID.
 *
 * @param remoteId - The u16 remote ID assigned at registration.
 * @param handler - Called with the raw payload buffer when a frame arrives.
 */
export function registerClientHandler(remoteId: number, handler: ClientHandler): void {
	assert(
		!clientHandlers.has(remoteId),
		`[Net/bridge] Client handler already registered for remote id ${remoteId}`,
	);
	clientHandlers.set(remoteId, handler);
}

/**
 * Reads a channel buffer and dispatches each frame to its registered server handler.
 * Called on the server when a client buffer arrives.
 *
 * Frame layout: [remote_id: u8][payload_size: varint (1–2 bytes)][payload bytes...]
 */
export function dispatchServer(player: Player, buf: buffer): void {
	const len = buffer.len(buf);
	let cursor = 0;

	while (cursor + 2 <= len) {
		const remoteId = buffer.readu8(buf, cursor);
		cursor += 1;

		const first = buffer.readu8(buf, cursor);
		cursor += 1;
		const payloadSize =
			(first & 0x80) === 0 ? first : (first & 0x7f) | (buffer.readu8(buf, cursor++) << 7);

		if (cursor + payloadSize > len) {
			warn(
				`[Net/bridge] Malformed buffer from ${player.Name}: payload overrun at cursor ${cursor}`,
			);
			break;
		}

		const payload = buffer.create(payloadSize);
		buffer.copy(payload, 0, buf, cursor, payloadSize);
		cursor += payloadSize;

		const handler = serverHandlers.get(remoteId);
		if (handler !== undefined) {
			handler(player, payload);
		} else {
			warn(`[Net/bridge] No server handler for remote id ${remoteId} (from ${player.Name})`);
		}
	}
}

/**
 * Dispatches a direct (unbatched) buffer on the server.
 * Wire format: [remote_id: u16][payload bytes...]
 */
export function dispatchServerDirect(player: Player, buf: buffer): void {
	if (buffer.len(buf) < 2) {
		warn(`[Net/bridge] Malformed direct buffer from ${player.Name}`);
		return;
	}
	const remoteId = buffer.readu16(buf, 0);
	const payloadSize = buffer.len(buf) - 2;
	const payload = buffer.create(payloadSize);
	buffer.copy(payload, 0, buf, 2, payloadSize);
	const handler = serverHandlers.get(remoteId);
	if (handler !== undefined) {
		handler(player, payload);
	} else {
		warn(`[Net/bridge] No server handler for remote id ${remoteId} (from ${player.Name})`);
	}
}

/**
 * Reads a channel buffer and dispatches each frame to its registered client handler.
 * Called on the client when a server buffer arrives.
 *
 * Frame layout: [remote_id: u8][payload_size: varint (1–2 bytes)][payload bytes...]
 */
export function dispatchClient(buf: buffer): void {
	const len = buffer.len(buf);
	let cursor = 0;

	while (cursor + 2 <= len) {
		const remoteId = buffer.readu8(buf, cursor);
		cursor += 1;

		const first = buffer.readu8(buf, cursor);
		cursor += 1;
		const payloadSize =
			(first & 0x80) === 0 ? first : (first & 0x7f) | (buffer.readu8(buf, cursor++) << 7);

		if (cursor + payloadSize > len) {
			warn(`[Net/bridge] Malformed buffer from server: payload overrun at cursor ${cursor}`);
			break;
		}

		const payload = buffer.create(payloadSize);
		buffer.copy(payload, 0, buf, cursor, payloadSize);
		cursor += payloadSize;

		const handler = clientHandlers.get(remoteId);
		if (handler !== undefined) {
			handler(payload);
		} else {
			warn(`[Net/bridge] No client handler for remote id ${remoteId}`);
		}
	}
}

/**
 * Dispatches a direct (unbatched) buffer on the client.
 * Wire format: [remote_id: u16][payload bytes...]
 */
export function dispatchClientDirect(buf: buffer): void {
	if (buffer.len(buf) < 2) {
		warn(`[Net/bridge] Malformed direct buffer from server`);
		return;
	}
	const remoteId = buffer.readu16(buf, 0);
	const payloadSize = buffer.len(buf) - 2;
	const payload = buffer.create(payloadSize);
	buffer.copy(payload, 0, buf, 2, payloadSize);
	const handler = clientHandlers.get(remoteId);
	if (handler !== undefined) {
		handler(payload);
	} else {
		warn(`[Net/bridge] No client handler for remote id ${remoteId}`);
	}
}

/**
 * Wraps a payload buffer with a u16 remote ID prefix for direct (unbatched) dispatch.
 * The dispatcher reads the first 2 bytes as the remote ID and routes the remainder as the payload.
 *
 * Wire format: [remoteId: u16][payload bytes...]
 *
 * @param remoteId - The u16 remote ID assigned at registration.
 * @param payload - The encoded payload buffer to wrap.
 */
export function wrapDirect(remoteId: number, payload: buffer): buffer {
	const payloadSize = buffer.len(payload);
	const buf = buffer.create(2 + payloadSize);
	buffer.writeu16(buf, 0, remoteId);
	buffer.copy(buf, 2, payload, 0, payloadSize);
	return buf;
}

/**
 * Resets all registered handlers back to their initial state.
 * @internal For tests and hot reload only.
 */
export function _reset(): void {
	serverHandlers.clear();
	clientHandlers.clear();
}
