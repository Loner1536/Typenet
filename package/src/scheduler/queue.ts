// Codec
import Writer from "../serial/writer";

type Encoder = (writer: Writer) => void;

export type PendingEntry = { player: Player; encode: Encoder; unreliable: boolean };
export type PendingBroadcast = { encode: Encoder; unreliable: boolean };

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
        } else {
            remaining.push(entry);
        }
    }

    pendingQueue.clear();
    for (const entry of remaining) pendingQueue.push(entry);

    for (const entry of pendingBroadcasts) {
        entry.encode(getChannel(player, entry.unreliable));
    }
}
