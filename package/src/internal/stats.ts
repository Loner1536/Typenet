// Root
import * as Types from "../types";

// Internal
import Config from "./config";

function createStats(): Types.PacketStats {
    return {
        bytesSent: 0,
        bytesReceived: 0,
        totalFires: 0,
        totalReceived: 0,
        lastSentAt: 0,
        lastReceivedAt: 0,
        averageBytes: 0,
        peakBytes: 0,
        totalDropped: 0,
        firstSentAt: 0,
        firstReceivedAt: 0,
    };
}

export default class Stats {
    private stats: Types.PacketStats = createStats();

    snapshot(): Types.PacketStats | undefined {
        if (!Config.statsEnabled()) return undefined;

        return { ...this.stats };
    }

    trackSend(bytes: number) {
        const now = os.clock();
        this.stats.totalFires++;
        this.stats.bytesSent += bytes;
        this.stats.lastSentAt = now;

        if (this.stats.firstSentAt === 0) this.stats.firstSentAt = now;
        if (bytes > this.stats.peakBytes) this.stats.peakBytes = bytes;

        this.stats.averageBytes = this.stats.bytesSent / this.stats.totalFires;
    }

    trackReceive(bytes: number) {
        const now = os.clock();
        this.stats.totalReceived++;
        this.stats.bytesReceived += bytes;
        this.stats.lastReceivedAt = now;

        if (this.stats.firstReceivedAt === 0) this.stats.firstReceivedAt = now;
    }

    trackDrop() {
        this.stats.totalDropped++;
    }
}
