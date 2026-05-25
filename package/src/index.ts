// Package
import { RunService } from "@rbxts/services";

// Root
import * as Types from "./types";

// Internal
import Logger from "./internal/logger";
import Config from "./internal/config";

// API
import { definePacket } from "./api/packet";

export { default as Channel } from "./api/channel";
export { default as Packet } from "./api/packet";

export { default as t } from "./codec";

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

        Config.set(options);
    },
    start: () => {
        if (IS_SERVER) {
            import("./transport/server").then((transport) => {
                transport.start();
                started.server = true;
            });
        } else {
            import("./transport/client").then((transport) => {
                transport.start();
                started.client = true;
            });
        }
    },

    definePacket,
};

export default Typenet;
