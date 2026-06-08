// Package
import { Players } from "@rbxts/services";

// Internal
import { IS_SERVER } from "@environment";
import Constant from "@constant";

// Transport
import Lifecycle from "./lifecycle";
import Outbound from "./outbound";

// Security
import Report from "@security/report";

let started = false;

function start() {
    if (started) {
        Report.log("warn", "HANDSHAKE_ALREADY_STARTED");
        return;
    }
    started = true;

    if (IS_SERVER) {
        Players.PlayerAdded.Connect((player) => {
            task.delay(Constant.HANDSHAKE_TIMEOUT, () => {
                if (player.Parent !== undefined && !Lifecycle.isReady(player)) {
                    Report.log("warn", "HANDSHAKE_TIMEOUT", { player });
                    player.Kick("Network handshake timed out.");
                }
            });
        });
    } else {
        Outbound.send(Constant.HANDSHAKE_PACKET_ID, undefined, undefined, undefined, false);

        Lifecycle.markReady(Players.LocalPlayer);

        Report.log("debug", "HANDSHAKE_SENT");
    }
}

const Handshake = {
    start,
};

export default Handshake;
