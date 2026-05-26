// Package
import { RunService } from "@rbxts/services";

// Root
import * as Types from "./types";

// Definitions
import definePacket from "./definitions/packet";

// Debug
import { configure } from "./debug/config";
import Logger from "./debug/logger";

export { default as Channel } from "./definitions/channel";
export { default as Packet } from "./definitions/packet";

export { default as t } from "./serial";

const FROM = "ROOT";
const IS_SERVER = RunService.IsServer();
const started = {
    inbound: false,
    unbound: false,
};

const Typenet = {
    set: (options: Types.Options) => {
        if (started.inbound || started.unbound) {
            Logger.warn(FROM, "Cannot set after starting systems");
            return;
        }

        configure(options);
    },
    start: () => {
        if (IS_SERVER) {
            import("./channel/inbound").then((inbound) => {
                inbound.start();

                started.inbound = true;
            });
        } else {
            import("./channel/outbound").then((outbound) => {
                if (IS_SERVER) outbound.startServer();
                else outbound.startClient();

                started.unbound = true;
            });
        }
    },

    definePacket,
};

export default Typenet;
