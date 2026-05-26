// Root
import * as Types from "../types";

// Internal
import { stats } from "../debug/config";

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
        bytesReceived: 0,
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

    snapshot(): Types.PacketStats | undefined {
        if (stats) return undefined;

        return {
            ...this.stats,
            sentBytes: { ...this.stats.sentBytes },
        };
    }

    trackSend(raw: number, overhead: number) {
        const now = os.clock();
        const total = raw + overhead;

        this.stats.sentBytes.raw = raw;
        this.stats.sentBytes.overhead = overhead;
        this.stats.sentBytes.total = total;

        this.stats.sentBytes.totalRaw += raw;
        this.stats.sentBytes.totalOverhead += overhead;
        this.stats.sentBytes.totalWire += total;

        if (this.stats.firstSentAt === 0) this.stats.firstSentAt = now;
        if (total > this.stats.peakBytes) this.stats.peakBytes = total;

        this.stats.averageBytes = this.stats.sentBytes.total / this.stats.totalFires;
    }

    trackReceive(bytes: number) {
        const now = os.clock();

        this.stats.totalReceived++;
        this.stats.bytesReceived += bytes;
        this.stats.lastReceivedAt = now;

        if (this.stats.firstReceivedAt === 0) this.stats.firstReceivedAt = now;
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
