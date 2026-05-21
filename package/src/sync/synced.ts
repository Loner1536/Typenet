// Package
import { Players, RunService } from "@rbxts/services";
import { subscribe, type Atom } from "@rbxts/charm";

// Types
import * as Types from "../types";

// Transport
import { writeToPlayer, registerFlushHook } from "../transport/server";
import { registerClientHandler } from "../transport/bridge";
import { createReader } from "../transport/reader";

// Net
import { register } from "../net/registry";

export type NetSynced<T> = {
	/**
	 * Server: subscribes to the atom. Any change marks all current players dirty
	 * and flushes a delta to each at the next Heartbeat.
	 * New players joining automatically receive a full snapshot.
	 *
	 * Client: registers a handler that decodes incoming sync payloads and
	 * writes the result into the atom.
	 *
	 * @example
	 * // server
	 * Network.PlayerData.bind(serverPlayerDataAtom);
	 * // client
	 * Network.PlayerData.bind(playerDataAtom);
	 */
	bind(atom: Atom<T>): void;
};

function createSyncedServer<T>(remoteId: number, config: Types.SyncedConfig<T>): NetSynced<T> {
	const codec = config.data as unknown as Types.InternalCodec<T>;
	const filter = config.filter;

	const lastSent = new Map<Player, T>();
	const dirty = new Set<Player>();

	let currentValue: T | undefined;

	function markAllDirty(): void {
		for (const player of Players.GetPlayers()) {
			dirty.add(player);
		}
	}

	function flushPlayer(player: Player): void {
		if (currentValue === undefined) return;

		const baseline = lastSent.get(player);
		const filteredValue = filter !== undefined ? filter(player, currentValue) : currentValue;
		const filteredBaseline =
			baseline !== undefined && filter !== undefined ? filter(player, baseline) : baseline;

		const size = codec.measure(filteredValue, filteredBaseline);
		const payload = buffer.create(size);
		codec.encode(payload, 0, filteredValue, filteredBaseline);

		config.onSend?.(player, size, filteredValue, filteredBaseline);

		writeToPlayer(player, remoteId, payload);
		lastSent.set(player, currentValue);
	}

	registerFlushHook(() => {
		for (const player of dirty) {
			flushPlayer(player);
		}
		dirty.clear();
	});

	// New player gets a full snapshot on the next flush.
	Players.PlayerAdded.Connect((player) => {
		if (currentValue !== undefined) dirty.add(player);
	});

	Players.PlayerRemoving.Connect((player) => {
		lastSent.delete(player);
		dirty.delete(player);
	});

	return {
		bind(atom: Atom<T>): void {
			currentValue = atom();
			markAllDirty();

			subscribe(atom, (value: T) => {
				currentValue = value;
				markAllDirty();
			});
		},
	};
}

function createSyncedClient<T>(remoteId: number, config: Types.SyncedConfig<T>): NetSynced<T> {
	const codec = config.data as unknown as Types.InternalCodec<T>;

	let lastReceived: T | undefined;

	return {
		bind(atom: Atom<T>): void {
			registerClientHandler(remoteId, (payload) => {
				const reader = createReader(payload);
				const value = codec.decode(reader, lastReceived);

				config.onReceive?.(buffer.len(payload), value, lastReceived);

				lastReceived = value;
				atom(value);
			});
		},
	};
}

/**
 * Creates a typed server-to-client synced channel.
 * Bind a server atom to push deltas automatically on change.
 * Bind a client atom to receive and apply those deltas.
 *
 * @example
 * const Network = createNamespace("Game", {
 *     PlayerData: defineSynced({
 *         data: t.map(t.u16, t.struct({ clicks: t.u32 })),
 *         filter: (recipient, data) => {
 *             const result = new Map();
 *             const own = data.get(recipient.UserId);
 *             if (own !== undefined) result.set(recipient.UserId, own);
 *             return result;
 *         },
 *     }),
 * });
 *
 * // server
 * Network.PlayerData.bind(serverAtom);
 *
 * // client
 * Network.PlayerData.bind(clientAtom);
 */
export function createSynced<T>(
	namespaceName: string,
	syncName: string,
	config: Types.SyncedConfig<T>,
): NetSynced<T> {
	const remoteId = register(namespaceName, syncName, "synced");

	if (RunService.IsServer()) {
		return createSyncedServer(remoteId, config);
	} else {
		return createSyncedClient(remoteId, config);
	}
}
