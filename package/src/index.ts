// Package
import { RunService } from "@rbxts/services";

// Root
import * as Types from "./types";

// Definitions
import definePacket from "./definition/packet";

// Debug
import { configure } from "./debug/config";
import Logger from "./debug/logger";

// Channel
import * as Outbound from "./channel/outbound";
import * as Inbound from "./channel/inbound";

export { default as Channel } from "./definition/channel";
export { default as Packet } from "./definition/packet";

export { default as t } from "./serial";

const FROM = "ROOT";
const IS_SERVER = RunService.IsServer();
const started = {
    server: false,
    client: false,
};

const Typenet = {
    set: (options: Types.Options) => {
        if (IS_SERVER ? started.server : started.client) {
            Logger.warn(FROM, "Cannot set after starting systems");
            return;
        }

        configure(options);
    },
    start: () => {
        if (IS_SERVER) {
            Inbound.start();
            Outbound.startServer();
            started.server = true;
        } else {
            Inbound.start();
            Outbound.startClient();
            started.client = true;
        }
    },

    definePacket,
};

export default Typenet;
