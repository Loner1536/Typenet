// Internal
import * as Type from "./type";

// Security
import Report from "./security/report";

// Transport
import Lifecycle from "./transport/lifecycle";
import Handshake from "./transport/handshake";
import Registry from "./transport/registry";
import Outbound from "./transport/outbound";
import Inbound from "./transport/inbound";
import Bridge from "./transport/bridge";
import Engine from "./transport/engine";

// API
import definePacket from "./api/packet";

export { default as t } from "./codec";
export * as Type from "./type";

let started = false;

function start(opts?: Type.StartOptions) {
    if (started) {
        Report.log("warn", "TYPENET_MULTIPLE_STARTS");
        return;
    }

    if (opts) {
        Report.setDebug(opts.debug ?? false);
    }

    Registry.finalize();
    Lifecycle.start();

    Bridge.start();
    Bridge.onReceive(Inbound.handle);

    Outbound.start();

    Handshake.start();
    Engine.start();
}

declare namespace Typenet {
    export type Codec<T> = Type.Codec.External<T>;
}

const Typenet = {
    start,

    definePacket,
};

export default Typenet;
