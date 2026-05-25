// Package
import { RunService, Players } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Codec
import Writer from "../codec/writer";

// Internal
import Stats from "./stats";

// Transport
import Server from "../transport/server";
import Client from "../transport/client";

const IS_SERVER = RunService.IsServer();

type Encoder = (writer: Writer) => void;

function handleTarget(encode: Encoder, unreliable: boolean, target?: Types.SendTarget) {
    if (!target) {
        Server.write("All", encode, unreliable);
    } else if (typeIs(target, "Instance") && target.IsA("Player")) {
        Server.write(target, encode, unreliable);
    } else if (typeIs(target, "table") && !("Except" in (target as object))) {
        for (const player of target as Player[]) {
            Server.write(player, encode, unreliable);
        }
    } else {
        const [, excluded] = target as ["Except", Player | Player[]];
        const excludedSet = new Set<Player>(
            typeIs(excluded, "Instance") ? [excluded] : (excluded as Player[]),
        );
        for (const player of Players.GetPlayers()) {
            if (!excludedSet.has(player)) {
                Server.write(player, encode, unreliable);
            }
        }
    }
}

export function send<T>(
    id: number,
    codec: Types.InternalCodec<T> | undefined,
    unreliable: boolean,
    tracker: Stats,
    dataOrTarget?: T | Types.SendTarget,
    target?: Types.SendTarget,
) {
    let bytes = 0;

    // Pack Id with Buffer
    const encode = (writer: Writer) => {
        const before = writer.cursor;
        writer.u8(id);
        if (codec) codec.encode(writer, dataOrTarget as T);
        bytes = writer.cursor - before;
    };

    if (IS_SERVER) {
        handleTarget(encode, unreliable, codec ? target : (dataOrTarget as Types.SendTarget));
    } else {
        Client.write(encode, unreliable);
    }

    tracker.trackSend(bytes);
}
