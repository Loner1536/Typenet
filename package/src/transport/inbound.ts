//!optimize 2
//!native

// Internal
import { IS_SERVER } from "@environment";
import Constant from "@constant";

// Binary
import Cursor from "@binary/cursor";

// Transport
import Lifecycle from "./lifecycle";
import Registry from "./registry";

// Security
import Report from "@security/report";

function handle(player: Player, buf: buffer) {
    if (buffer.len(buf) > Constant.MAX_PAYLOAD) {
        Report.log("kick", "INBOUND_PAYLOAD_TOO_LARGE", { player, size: buffer.len(buf) });
        return;
    }

    if (buffer.len(buf) === 0) {
        Report.log("kick", "INBOUND_EMPTY_BUFFER", { player });
        return;
    }

    if (buffer.len(buf) === 1 && buffer.readu8(buf, 0) === 0) {
        Report.log("debug", "INBOUND_IDENTICAL_FRAME", { player });
        return;
    }

    parse(player, buf);
}

function parse(player: Player, buf: buffer) {
    const cursor = new Cursor(buf, IS_SERVER ? player : undefined);

    while (cursor.remaining() >= 2) {
        const id = cursor.u16();

        if (id === Constant.HANDSHAKE_PACKET_ID) {
            if (IS_SERVER) {
                Report.log("debug", "INBOUND_HANDSHAKE", { player });
                Lifecycle.markReady(player);
            }
            continue;
        }

        if (IS_SERVER && !Lifecycle.isReady(player)) {
            Report.log("kick", "INBOUND_NOT_READY", { player });
            return;
        }

        const def = Registry.getById(id);
        if (def === undefined) {
            Report.log("warn", "INBOUND_UNKNOWN_PACKET", { player, id });
            return;
        }

        if (def.handler === undefined) {
            Report.log("warn", "INBOUND_NO_HANDLER", { player, id, name: def.name });
        }

        const data = def.codec !== undefined ? def.codec.read(cursor) : undefined;
        if (def.handler !== undefined) {
            def.handler(player, data);
        }
    }

    if (cursor.remaining() > 0) {
        Report.log("kick", "INBOUND_LEFTOVER_BYTES", { player, remaining: cursor.remaining() });
    }
}

const Inbound = {
    handle,
};

export default Inbound;
