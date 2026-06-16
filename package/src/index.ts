// Internal
import definePacket from "@define/packet";

// Transport
import Bridge from "@transport/bridge";
import Engine from "@transport/engine";

export { default as Channel } from "@define/channel";
export { packet } from "@define/packet";

let started = false;
function start() {
    if (started) {
        return; // TODO: Add logging
    }

    Bridge.start();
    Engine.start();
}

const Typenet = {
    start,

    definePacket,
};

export default Typenet;
