// Package
import { RunService } from "@rbxts/services";

// Serial
import Writer from "../serial/writer";

// Channel
import { reliable, unreliable } from "../channel/wire";

export function startHeartbeat(
    reliableChannels: Map<Player, Writer>,
    unreliableChannels: Map<Player, Writer>,
    readyPlayers: Set<Player>,
) {
    const _reliable = reliable();
    const _unreliable = unreliable();

    RunService.Heartbeat.Connect(() => {
        for (const player of readyPlayers) {
            const rCh = reliableChannels.get(player);
            if (rCh && rCh.cursor > 0) {
                _reliable.FireClient(player, rCh.toBuffer());
                rCh.reset();
            }

            const uCh = unreliableChannels.get(player);
            if (uCh && uCh.cursor > 0) {
                _unreliable.FireClient(player, uCh.toBuffer());
                uCh.reset();
            }
        }
    });
}

export function startClientHeartbeat(reliableChannel: Writer, unreliableChannel: Writer) {
    const _reliable = reliable();
    const _unreliable = unreliable();

    RunService.Heartbeat.Connect(() => {
        if (reliableChannel.cursor > 0) {
            _reliable.FireServer(reliableChannel.toBuffer());
            reliableChannel.reset();
        }
        if (unreliableChannel.cursor > 0) {
            _unreliable.FireServer(unreliableChannel.toBuffer());
            unreliableChannel.reset();
        }
    });
}
