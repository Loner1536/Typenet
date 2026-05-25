// Package
import { RunService, Players } from "@rbxts/services";

// Types
import type * as Types from "../types";

// Codec
import { encode, encodeRaw, encodeEmpty } from "../codec/encoder";

// Internal
import Stats from "./stats";

// Transport
import Server from "../transport/server";
import Client from "../transport/client";

const IS_SERVER = RunService.IsServer();

export function handleTarget(data: string, unreliable: boolean, target?: Types.SendTarget) {
    if (IS_SERVER && !target) {
        Server.queue("All", data, unreliable);
    } else if (typeIs(target, "Instance") && target.IsA("Player")) {
        Server.queue(target, data, unreliable);
    } else if (typeIs(target, "table") && !("Except" in (target as object))) {
        for (const player of target as Player[]) {
            Server.queue(player, data, unreliable);
        }
    } else {
        const [, excluded] = target as ["Except", Player | Player[]];
        const excludedSet = new Set<Player>(
            typeIs(excluded, "Instance") ? [excluded] : (excluded as Player[]),
        );
        for (const player of Players.GetPlayers()) {
            if (!excludedSet.has(player)) {
                Server.queue(player, data, unreliable);
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
    let str: string;
    let bytes: number;

    if (codec) {
        if (codec._raw) {
            [str, bytes] = encodeRaw(id, dataOrTarget);
        } else {
            [str, bytes] = encode(id, codec, dataOrTarget as T);
        }
        tracker.trackSend(bytes);
    } else {
        str = encodeEmpty(id);
        tracker.trackSend(0);
    }

    if (IS_SERVER) {
        handleTarget(str, unreliable, codec ? target : (dataOrTarget as Types.SendTarget));
    } else {
        Client.send(str, unreliable);
    }
}
