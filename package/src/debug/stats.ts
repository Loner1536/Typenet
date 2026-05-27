// Root
import * as Types from "../types";

const stats = new Map<string, Stats>();

export function getStats(name: string): Stats | undefined {
    return stats.get(name);
}

export function resetStats() {
    stats.clear();
}

export default class Stats {
    private stats: Types.PacketStats = {
        // Send
        sentBytes: {
            raw: 0,
            overhead: 0,
            total: 0,
            totalRaw: 0,
            totalOverhead: 0,
            totalWire: 0,
        },
        totalFires: 0,
        firstSentAt: 0,
        lastSentAt: 0,

        // Receive
        receivedBytes: {
            raw: 0,
            overhead: 0,
            total: 0,
            totalRaw: 0,
            totalOverhead: 0,
            totalWire: 0,
        },
        totalReceived: 0,
        firstReceivedAt: 0,
        lastReceivedAt: 0,

        // Bandwidth
        averageBytes: 0,
        peakBytes: 0,

        // Reliability
        totalDropped: 0,
        dropRate: 0,

        // Latency
        roundTripTime: 0,
        lastRoundTripAt: 0,
    };

    constructor(name: string) {
        stats.set(name, this);
    }

    snapshot(): Types.PacketStats {
        return {
            ...this.stats,
            sentBytes: { ...this.stats.sentBytes },
            receivedBytes: { ...this.stats.receivedBytes },
        };
    }

    trackSend(rawBytes: number, wireBytes: number) {
        const now = os.clock();
        const overhead = wireBytes - rawBytes;

        this.stats.sentBytes.raw = rawBytes;
        this.stats.sentBytes.overhead = overhead;
        this.stats.sentBytes.total = wireBytes;
        this.stats.sentBytes.totalRaw += rawBytes;
        this.stats.sentBytes.totalOverhead += overhead;
        this.stats.sentBytes.totalWire += wireBytes;

        this.stats.totalFires++;

        if (this.stats.firstSentAt === 0) this.stats.firstSentAt = now;
        this.stats.lastSentAt = now;

        if (wireBytes > this.stats.peakBytes) this.stats.peakBytes = wireBytes;
        this.stats.averageBytes = this.stats.sentBytes.totalWire / this.stats.totalFires;
    }

    trackReceive(rawBytes: number, wireBytes: number) {
        const now = os.clock();
        const overhead = wireBytes - rawBytes;

        this.stats.receivedBytes.raw = rawBytes;
        this.stats.receivedBytes.overhead = overhead;
        this.stats.receivedBytes.total = wireBytes;
        this.stats.receivedBytes.totalRaw += rawBytes;
        this.stats.receivedBytes.totalOverhead += overhead;
        this.stats.receivedBytes.totalWire += wireBytes;

        this.stats.totalReceived++;

        if (this.stats.firstReceivedAt === 0) this.stats.firstReceivedAt = now;
        this.stats.lastReceivedAt = now;

        if (wireBytes > this.stats.peakBytes) this.stats.peakBytes = wireBytes;
    }

    trackRoundTrip(sentAt: number) {
        const now = os.clock();
        this.stats.roundTripTime = now - sentAt;
        this.stats.lastRoundTripAt = now;
    }

    trackDrop() {
        this.stats.totalDropped++;

        const total = this.stats.totalFires + this.stats.totalDropped;
        this.stats.dropRate = total > 0 ? this.stats.totalDropped / total : 0;
    }
}
