// Codec
import Writer from "../serial/writer";

// Definitions
import { getStats } from "../definitions/registry";

type Encoder = (writer: Writer) => void;

export type PendingEntry = {
    player: Player;
    name: string;
    encode: Encoder;
    unreliable: boolean;
    onFlush?: (stats: ReturnType<typeof getStats>) => void;
};
export type PendingBroadcast = {
    name: string;
    encode: Encoder;
    unreliable: boolean;
    onFlush?: (stats: ReturnType<typeof getStats>) => void;
};

export const pendingQueue: PendingEntry[] = [];
export const pendingBroadcasts: PendingBroadcast[] = [];

export function flushPending(
    player: Player,
    getChannel: (player: Player, unreliable: boolean) => Writer,
) {
    const remaining: PendingEntry[] = [];

    for (const entry of pendingQueue) {
        if (entry.player === player) {
            entry.encode(getChannel(player, entry.unreliable));
            if (entry.onFlush) entry.onFlush(getStats(entry.name));
        } else {
            remaining.push(entry);
        }
    }

    pendingQueue.clear();
    for (const entry of remaining) pendingQueue.push(entry);

    for (const entry of pendingBroadcasts) {
        entry.encode(getChannel(player, entry.unreliable));
        if (entry.onFlush) entry.onFlush(getStats(entry.name));
    }
}
