// Package
import { HttpService } from "@rbxts/services";

// Security
import Report from "@security/report";

// Internal
import * as Type from "@type";

export default {
    write: (writer, value) => {
        const [ok, json] = pcall(() => HttpService.JSONEncode(value));
        if (!ok) {
            Report.log("warn", "JSON_ENCODE_FAILED", { error: tostring(json) });
            writer.string("", 1);
            return;
        }
        const len = json.size();

        writer.u16(len);
        writer.string(json, len);
    },
    read: (cursor) => {
        const len = cursor.u16();
        const json = cursor.string(len);
        const [ok, value] = pcall(() => HttpService.JSONDecode(json));
        if (!ok) {
            Report.log("warn", "JSON_DECODE_FAILED", { error: tostring(value) });
            return undefined;
        }
        return value;
    },
    _default: undefined,
} as Type.Codec.Internal<unknown> as Type.Codec.External<unknown>;
