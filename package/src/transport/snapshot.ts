//!optimize 2
//!native

// Internal
import { IS_SERVER } from "@environment";

// Security
import Report from "@security/report";

let currentPlayer: Player | undefined;
let nextId = 1;

export function allocId(): number {
    return nextId++;
}

export function setCurrentPlayer(player: Player | undefined): void {
    currentPlayer = player;
}
export function getCurrentPlayer(): Player | undefined {
    return currentPlayer;
}

const clientCache = new Map<number, unknown>();
const serverCache = new Map<number, Map<Player, unknown>>();

export function getCache(id: number, player?: Player): unknown | undefined {
    if (IS_SERVER) {
        if (player === undefined) {
            Report.log("warn", "BASELINE_SERVER_NO_PLAYER", { id });
            return undefined;
        }
        return serverCache.get(id)?.get(player);
    }
    return clientCache.get(id);
}

export function setCache(id: number, value: unknown, player?: Player): void {
    if (IS_SERVER) {
        if (player === undefined) {
            Report.log("warn", "BASELINE_SERVER_NO_PLAYER", { id });
            return;
        }
        if (!serverCache.has(id)) serverCache.set(id, new Map());
        serverCache.get(id)!.set(player, value);
    } else {
        clientCache.set(id, value);
    }
}

export function clearPlayer(player: Player): void {
    for (const [_, playerMap] of serverCache) {
        playerMap.delete(player);
    }
}

const Snapshot = {
    allocId,
    getCache,
    setCache,
    clearPlayer,

    setCurrentPlayer,
    getCurrentPlayer,
};

export default Snapshot;
