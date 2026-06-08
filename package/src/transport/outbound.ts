//!optimize 2

// Internal
import { IS_SERVER } from "@environment";
import * as Type from "@type";

// Binary
import Writer from "@binary/writer";

// Transport
import Lifecycle from "./lifecycle";
import Snapshot from "./snapshot";
import Bridge from "./bridge";

// Utility
import resolveTarget from "@utility/resolve-target";

// Security
import Report from "@security/report";

let started = false;

const writer = new Writer();

const playerWriters = new Map<Player, Writer>();
const lastSentBuffers = new Map<Player, buffer>();
const lastSentPerPacket = new Map<number, Map<Player, buffer>>();

const flushQueue: Type.FlushEntry[] = [];
const heldBuffers: Type.HeldBuffer[] = [];

function send<T>(
    id: number,
    codec: Type.Codec.Internal<T> | undefined,
    data: T | undefined,
    target: Type.Target | undefined,
    unreliable: boolean,
    xor?: boolean,
) {
    if (!started) {
        Report.log("warn", "OUTBOUND_NOT_STARTED", { id });
        return;
    }

    Report.log("debug", "OUTBOUND_SEND_CALLED", { id, targetIsUndefined: target === undefined });

    if (codec?._delta) {
        flushQueue.push({
            id,
            start: 0,
            end: 0,
            target,
            unreliable,
            codec: codec as Type.Codec.Internal<unknown>,
            data: data as unknown,
            xor: xor ?? true,
        });
        return;
    }

    const start = writer.offset;
    writer.u16(id);
    if (codec !== undefined) codec.write(writer, data as T);

    flushQueue.push({
        id,
        start,
        end: writer.offset,
        target,
        unreliable,
        codec: codec as Type.Codec.Internal<unknown>,
        data: data as unknown,
        xor: xor ?? true,
    });
}

function packetChanged(id: number, player: Player, s: number, e: number): boolean {
    if (!lastSentPerPacket.has(id)) lastSentPerPacket.set(id, new Map());
    const playerMap = lastSentPerPacket.get(id)!;

    const last = playerMap.get(player);
    const size = e - s;

    if (last !== undefined && buffer.len(last) === size) {
        let same = true;
        for (let i = 0; i < size; i++) {
            if (buffer.readu8(writer.buf, s + i) !== buffer.readu8(last, i)) {
                same = false;
                break;
            }
        }
        if (same) return false;
    }

    const newBuf = writer.copyOut(s, e);
    playerMap.set(player, newBuf);
    return true;
}

function flush() {
    if (flushQueue.size() === 0) return;

    if (IS_SERVER) {
        for (const entry of flushQueue) {
            const players = resolveTarget(entry.target);

            if (players.size() === 0) {
                Report.log("debug", "OUTBOUND_NO_RECIPIENTS", { id: entry.id });
            }

            for (const player of players) {
                const pw = getPlayerWriter(player);

                if (entry.codec?._delta) {
                    Snapshot.setCurrentPlayer(player);
                    const before = pw.used();
                    pw.u16(entry.id);
                    entry.codec.write(pw, entry.data);
                    const after = pw.used();
                    Report.log("debug", "OUTBOUND_DELTA_SIZE", {
                        player,
                        id: entry.id,
                        bytes: after - before,
                    });
                    Snapshot.setCurrentPlayer(undefined);
                } else if (!entry.xor || packetChanged(entry.id, player, entry.start, entry.end)) {
                    pw.bytes(writer.buf, entry.start, entry.end - entry.start);
                }
            }
        }

        for (const [player, playerWriter] of playerWriters) {
            const used = playerWriter.used();
            if (used === 0) {
                playerWriter.reset();
                continue;
            }

            const buf = playerWriter.copyOut(0, used);
            if (!Lifecycle.isReady(player)) {
                holdForPlayer(player, buf, false);
            } else {
                fireToPlayer(player, buf, false);
            }

            playerWriter.reset();
        }

        playerWriters.clear();
    } else {
        for (const entry of flushQueue) {
            if (entry.codec?._delta) {
                writer.u16(entry.id);
                entry.codec.write(writer, entry.data);
            }
        }

        const used = writer.used();
        if (used > 0) {
            const buf = writer.copyOut(0, used);
            Bridge.fireReliable(undefined, buf);
        }
    }

    flushQueue.clear();
    writer.reset();
}

function getPlayerWriter(player: Player): Writer {
    if (!playerWriters.has(player)) {
        playerWriters.set(player, new Writer());
    }

    return playerWriters.get(player)!;
}

function holdForPlayer(player: Player, buf: buffer, unreliable: boolean) {
    heldBuffers.push({ player, buf, unreliable });
    Report.log("debug", "OUTBOUND_HELD", { player, raw: buffer.len(buf) });
}

function fireToPlayer(player: Player, buf: buffer, unreliable: boolean) {
    if (unreliable) {
        Bridge.fireUnreliable(player, buf);
    } else {
        Bridge.fireReliable(player, buf);
    }
    Report.log("debug", "OUTBOUND_FIRED", { player, raw: buffer.len(buf), unreliable });
}

function releasePlayer(player: Player) {
    const stillHeld: Type.HeldBuffer[] = [];
    let released = 0;

    for (const held of heldBuffers) {
        if (held.player === player) {
            fireToPlayer(held.player, held.buf, held.unreliable);
            released++;
        } else {
            stillHeld.push(held);
        }
    }

    if (released > 0) {
        Report.log("debug", "OUTBOUND_RELEASED", { player, count: released });
    }

    heldBuffers.clear();
    for (const h of stillHeld) heldBuffers.push(h);
}

function cleanupPlayer(player: Player) {
    const stillHeld: Type.HeldBuffer[] = [];
    let dropped = 0;

    for (const held of heldBuffers) {
        if (held.player !== player) {
            stillHeld.push(held);
        } else {
            dropped++;
        }
    }

    if (dropped > 0) {
        Report.log("debug", "OUTBOUND_DROPPED", { player, count: dropped });
    }

    heldBuffers.clear();
    for (const h of stillHeld) heldBuffers.push(h);
}

function start() {
    started = true;
    Lifecycle.onReady((player) => releasePlayer(player));
    Lifecycle.onLeave((player) => {
        lastSentPerPacket.forEach((playerMap) => playerMap.delete(player));
        lastSentBuffers.delete(player);
        Snapshot.clearPlayer(player);
        cleanupPlayer(player);
    });
}

const Outbound = {
    start,
    send,
    flush,
};

export default Outbound;
