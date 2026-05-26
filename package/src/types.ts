// Codec
import Reader from "./serial/reader";
import Writer from "./serial/writer";

export interface Codec<T> {
	/** @hidden */ readonly _nominal_codec: T;
}
export type InferCodec<C> = C extends Codec<infer T> ? T : never;
export type InferSchema<S extends Record<string, Codec<unknown>>> = {
    [K in keyof S]: InferCodec<S[K]>;
};

export type InternalCodec<T> = Codec<T> & {
    encode: (writer: Writer, value: T) => void;
    decode: (reader: Reader) => T;
    _size: number;
};

export type StatsPacket<T> = T extends undefined
    ? {
        snapshot: () => PacketStats | undefined;
        on: (
            fn: (stats: PacketStats | undefined, player?: Player) => void,
        ) => RBXScriptConnection;
        once: (
            fn: (stats: PacketStats | undefined, player?: Player) => void,
        ) => RBXScriptConnection;
    }
    : {
        snapshot: () => PacketStats | undefined;
        on: (
            fn: (data: T, stats: PacketStats | undefined, player?: Player) => void,
        ) => RBXScriptConnection;
        once: (
            fn: (data: T, stats: PacketStats | undefined, player?: Player) => void,
        ) => RBXScriptConnection;
    };

type SendStats = {
    stats: (fn?: (stats: PacketStats | undefined) => void) => void;
};

export type Packet<T> = T extends undefined
    ? {
        stats: StatsPacket<T>;
        send: (target?: Player | Player[] | ["Except", Player | Player[]]) => SendStats;
        on: (fn: (player?: Player) => void) => RBXScriptConnection;
        once: (fn: (player?: Player) => void) => RBXScriptConnection;
    }
    : {
        stats: StatsPacket<T>;
        send: (
            data: T,
            target?: Player | Player[] | ["Except", Player | Player[]],
        ) => SendStats;
        on: (fn: (data: T, player?: Player) => void) => RBXScriptConnection;
        once: (fn: (data: T, player?: Player) => void) => RBXScriptConnection;
    };

export type SendTarget = Player | Player[] | ["Except", Player | Player[]];

export type PacketDefinition<T> = {
    _codec: Codec<T> | undefined;
    _unreliable: boolean;
};

export type PacketOptions = {
    unreliable: boolean;
};

export namespace Channel {
    export type Scope = {
        Client?: Record<string, Packet<unknown>>;
        Server?: Record<string, Packet<unknown>>;
    };
}

export type PacketStats = {
    sentBytes: {
        raw: number;
        overhead: number;
        total: number;

        totalRaw: number;
        totalOverhead: number;
        totalWire: number;
    };
    totalFires: number;
    firstSentAt: number;
    lastSentAt: number;

    // Receive
    bytesReceived: number;
    totalReceived: number;
    firstReceivedAt: number;
    lastReceivedAt: number;

    // Bandwidth
    averageBytes: number;
    peakBytes: number;

    // Reliability
    totalDropped: number;
    dropRate: number;

    // Latency
    roundTripTime: number;
    lastRoundTripAt: number;
};

export type Options = {
    debug?: boolean;
    stats?: boolean;
};
