// Serial
import Writer from "../serial/writer";

type Encoder = (writer: Writer) => void;

export type PendingEntry = {
    player: Player;
    name: string;
    encode: Encoder;
    unreliable: boolean;
};

export type PendingBroadcast = {
    name: string;
    encode: Encoder;
    unreliable: boolean;
};

export const pendingQueue: PendingEntry[] = [];
export const pendingBroadcasts: PendingBroadcast[] = [];

export function flushPending(player: Player, entries: PendingEntry[]): PendingEntry[] {
    const remaining: PendingEntry[] = [];
    const flushed: PendingEntry[] = [];

    for (const entry of entries) {
        if (entry.player === player) {
            flushed.push(entry);
        } else {
            remaining.push(entry);
        }
    }

    pendingQueue.clear();
    for (const entry of remaining) pendingQueue.push(entry);

    return flushed;
}
