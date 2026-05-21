export type RemoteKind = "event" | "function/request" | "function/response" | "synced";

/** A registered remote entry with a stable u16 ID used for routing. */
export type RemoteEntry = {
	/** u16, 1-indexed. Written as the first 2 bytes of every channel frame. */
	readonly id: number;
	readonly namespace: string;
	readonly name: string;
	readonly kind: RemoteKind;
};

const entries: RemoteEntry[] = [];
const byKey = new Map<string, RemoteEntry>();
let nextId = 1;

/**
 * Registers a remote and returns its stable u16 ID.
 *
 * Assigns sequential IDs starting from 1 (0 is reserved as invalid).
 * Idempotent — calling again with the same key and kind returns the existing ID.
 * Throws if the same key is registered under a different kind, or if the 65535 ID limit is exceeded.
 *
 * @param namespace - The namespace this remote belongs to.
 * @param name - The name of this remote within the namespace.
 * @param kind - Whether this is an event, function request, or function response.
 *
 * @example
 * const id = register("Player", "Died", "event"); // → 1
 * register("Player", "Died", "event");             // → 1 (idempotent)
 */
export function register(namespace: string, name: string, kind: RemoteKind): number {
	const key = `${namespace}/${name}/${kind}`;
	const existing = byKey.get(key);

	if (existing !== undefined) {
		assert(
			existing.kind === kind,
			`[Net/registry] "${key}" already registered as "${existing.kind}", cannot re-register as "${kind}"`,
		);
		return existing.id;
	}

	assert(nextId <= 65535, "[Net/registry] Remote ID overflow — too many remotes registered");

	const entry: RemoteEntry = { id: nextId++, namespace, name, kind };
	entries.push(entry);
	byKey.set(key, entry);

	return entry.id;
}

/**
 * Looks up a remote entry by its u16 ID.
 * Returns `undefined` for unknown IDs.
 */
export function getById(id: number): RemoteEntry | undefined {
	return entries[id - 1];
}

/** Looks up a remote entry by namespace and name. */
export function getByKey(namespace: string, name: string): RemoteEntry | undefined {
	return byKey.get(`${namespace}/${name}`);
}

/** Returns the total number of registered remotes. */
export function count(): number {
	return entries.size();
}

/** Returns all entries in registration order. */
export function all(): ReadonlyArray<RemoteEntry> {
	return entries;
}

/**
 * Resets all registry state back to its initial values.
 * @internal For tests and hot reload only.
 */
export function _reset(): void {
	entries.clear();
	byKey.clear();
	nextId = 1;
}
