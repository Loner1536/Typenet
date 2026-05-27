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
};

type SendStats = {
    stats: (fn?: (stats: PacketStats | undefined) => void) => void;
};

type ReceiveStats<T> = T extends undefined
    ? {
        stats: (
            fn?: (stats: PacketStats | undefined, player?: Player) => void,
        ) => RBXScriptConnection;
        Disconnect: () => void;
    }
    : {
        stats: (
            fn?: (data: T, stats: PacketStats | undefined, player?: Player) => void,
        ) => RBXScriptConnection;
        Disconnect: () => void;
    };

export type QueryDefinition<Req, Res> = {
    _requestCodec: Codec<Req> | undefined;
    _responseCodec: Codec<Res> | undefined;
};

export type QueryRequest<Res> = Promise<Res> & {
    stats: (fn?: (stats: PacketStats | undefined) => void) => QueryRequest<Res>;
};

export type Query<Req, Res> = Req extends undefined
    ? {
        request: (target?: SendTarget) => QueryRequest<Res>;
        response: (fn: (player?: Player) => Res) => {
            stats: (
                fn?: (stats: PacketStats | undefined, player?: Player) => void,
            ) => RBXScriptConnection;
            Disconnect: () => void;
        };
    }
    : {
        request: (data: Req, target?: SendTarget) => QueryRequest<Res>;
        response: (fn: (data: Req, player?: Player) => Res) => {
            stats: (
                fn?: (data: Req, stats: PacketStats | undefined, player?: Player) => void,
            ) => RBXScriptConnection;
            Disconnect: () => void;
        };
    };

export type PacketDefinition<T> = {
    _codec: Codec<T> | undefined;
    _unreliable: boolean;
};

export type PacketOptions = {
    unreliable: boolean;
};

export type Packet<T> = T extends undefined
    ? {
        send: (target?: Player | Player[] | ["Except", Player | Player[]]) => SendStats;
        on: (fn: (player?: Player) => void) => ReceiveStats<T>;
        once: (fn: (player?: Player) => void) => ReceiveStats<T>;
    }
    : {
        send: (
            data: T,
            target?: Player | Player[] | ["Except", Player | Player[]],
        ) => SendStats;
        on: (fn: (data: T, player?: Player) => void) => ReceiveStats<T>;
        once: (fn: (data: T, player?: Player) => void) => ReceiveStats<T>;
    };
export type SendTarget = Player | Player[] | ["Except", Player | Player[]];

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
    receivedBytes: {
        raw: number;
        overhead: number;
        total: number;

        totalRaw: number;
        totalOverhead: number;
        totalWire: number;
    };
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
