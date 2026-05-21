// Package
import { Players, RunService } from "@rbxts/services";

// Transport
import { dispatchServer, dispatchServerDirect } from "./bridge";
import { createChannel, Channel } from "./channel";

const RS = game.GetService("ReplicatedStorage");
const REMOTE_FOLDER = "__Net__";

const OUTBOUND_NAME = "__S2C__";
const OUTBOUND_NAME_DIRECT = "__S2C_Direct__";

const INBOUND_NAME = "__C2S__";
const INBOUND_NAME_DIRECT = "__C2S_Direct__";

let outbound: RemoteEvent;
let outboundDirect: RemoteEvent;

let inbound: RemoteEvent;
let inboundDirect: RemoteEvent;

const playerChannels = new Map<Player, Channel>();
const flushHooks: Array<() => void> = [];

let flushConnection: RBXScriptConnection | undefined;
let started = false;

function getOrCreateRemote(parent: Instance, name: string): RemoteEvent {
	const existing = parent.FindFirstChild(name);
	if (existing !== undefined) {
		assert(existing.IsA("RemoteEvent"), `[Net/server] ${name} is not a RemoteEvent`);
		return existing as RemoteEvent;
	}
	const remote = new Instance("RemoteEvent");
	remote.Name = name;
	remote.Parent = parent;
	return remote;
}

function getOrCreateFolder(): Folder {
	const existing = RS.FindFirstChild(REMOTE_FOLDER);
	if (existing !== undefined) {
		assert(existing.IsA("Folder"), "[Net/server] __Net__ is not a Folder");
		return existing as Folder;
	}
	const folder = new Instance("Folder");
	folder.Name = REMOTE_FOLDER;
	folder.Parent = RS;
	return folder;
}

function getChannel(player: Player): Channel {
	let ch = playerChannels.get(player);
	if (ch === undefined) {
		ch = createChannel();
		playerChannels.set(player, ch);
	}
	return ch;
}

/**
 * Writes a payload into a player's outbound channel.
 * The channel is flushed to the player as a single buffer each Heartbeat.
 *
 * @param player - The recipient.
 * @param remoteId - The u16 remote ID assigned at registration.
 * @param payload - The encoded payload buffer.
 */
export function writeToPlayer(player: Player, remoteId: number, payload: buffer): void {
	getChannel(player).write(remoteId, payload);
}

export function writeToPlayerDirect(player: Player, payload: buffer): void {
	outboundDirect.FireClient(player, payload);
}

/**
 * Writes a payload into every current player's outbound channel.
 *
 * @param remoteId - The u16 remote ID assigned at registration.
 * @param payload - The encoded payload buffer.
 */
export function writeToAll(remoteId: number, payload: buffer): void {
	for (const player of Players.GetPlayers()) {
		getChannel(player).write(remoteId, payload);
	}
}

/**
 * Starts the server transport. Creates the `__Net__` folder and remotes under
 * `ReplicatedStorage` if they don't exist, begins listening for inbound client
 * buffers, and flushes all per-player channels every Heartbeat.
 *
 * Must be called once from `Net.start()` on the server. Throws if called twice.
 */
export function start(): void {
	assert(!started, "[Net/server] Already started");
	started = true;

	const folder = getOrCreateFolder();

	outbound = getOrCreateRemote(folder, OUTBOUND_NAME);
	outboundDirect = getOrCreateRemote(folder, OUTBOUND_NAME_DIRECT);

	inbound = getOrCreateRemote(folder, INBOUND_NAME);
	inboundDirect = getOrCreateRemote(folder, INBOUND_NAME_DIRECT);

	inbound.OnServerEvent.Connect((player, data) => {
		if (typeIs(data, "buffer")) dispatchServer(player, data);
		else warn(`[Net/server] Non-buffer received from ${player.Name}`);
	});

	inboundDirect.OnServerEvent.Connect((player, data) => {
		if (typeIs(data, "buffer")) dispatchServerDirect(player, data);
		else warn(`[Net/server] Non-buffer received from ${player.Name}`);
	});

	Players.PlayerRemoving.Connect((player: Player) => {
		playerChannels.delete(player);
	});

	flushConnection = RunService.Heartbeat.Connect((_dt: number) => {
		flush();
	});
}

/**
 * Registers a callback to run at the start of every Heartbeat flush,
 * before per-player channels are drained. Used by synced channels to
 * write dirty payloads into channels before they go out on the wire.
 */
export function registerFlushHook(fn: () => void): void {
	flushHooks.push(fn);
}

/**
 * Flushes all per-player channels, firing one `RemoteEvent` per dirty player.
 * Called automatically every Heartbeat after `start()`.
 */
export function flush(): void {
	for (const hook of flushHooks) {
		hook();
	}

	for (const [player, channel] of playerChannels) {
		const buf = channel.flush();
		if (buf !== undefined) {
			outbound.FireClient(player, buf);
		}
	}
}

/** Disconnects the Heartbeat flush and marks the transport as stopped. */
export function stop(): void {
	flushConnection?.Disconnect();
	flushConnection = undefined;
	started = false;
}

/**
 * Stops the transport and clears all per-player channels.
 * @internal For tests and hot reload only.
 */
export function _reset(): void {
	stop();
	playerChannels.clear();
	flushHooks.clear();
}
