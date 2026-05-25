// Package
import { RunService, Players } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Codec
import type Reader from "../codec/reader";

// Internal
import Stats from "./stats";

// Transport
import Server from "../transport/server";
import Client from "../transport/client";

const IS_SERVER = RunService.IsServer();

export function createConnection(disconnect: () => void): RBXScriptConnection {
    return {
        Connected: true,
        Disconnect() {
            if (!this.Connected) return;
            this.Connected = false;
            disconnect();
        },
    };
}

export function createListener<T>(
    id: number,
    codec: Types.InternalCodec<T> | undefined,
    tracker: Stats,
    fn: (data: T, player?: Player) => void,
    withStats?: (data: T, stats: Types.PacketStats | undefined, player?: Player) => void,
): RBXScriptConnection {
    const handle = (reader: Reader, player?: Player) => {
        let data: T;

        if (codec) {
            const before = reader.offset;
            [data] = codec.decode(reader);
            tracker.trackReceive(reader.offset - before);
        } else {
            data = undefined as T;
            tracker.trackReceive(0);
        }

        const resolvedPlayer = IS_SERVER ? player : Players.LocalPlayer;

        if (codec) {
            fn(data, resolvedPlayer);
        } else {
            (fn as unknown as (player?: Player) => void)(resolvedPlayer);
        }

        if (withStats) {
            const snap = tracker.snapshot();
            if (codec) {
                withStats(data, snap, resolvedPlayer);
            } else {
                (
                    withStats as unknown as (
                        stats: Types.PacketStats | undefined,
                        player?: Player,
                    ) => void
                )(snap, resolvedPlayer);
            }
        }
    };

    if (IS_SERVER) {
        const serverListener = (reader: Reader, player: Player) => handle(reader, player);
        Server.listen(id, serverListener);
        return createConnection(() => Server.unlisten(id, serverListener));
    } else {
        const clientListener = (reader: Reader) => handle(reader);
        Client.listen(id, clientListener);
        return createConnection(() => Client.unlisten(id, clientListener));
    }
}
