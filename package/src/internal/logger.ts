// Internal
import Config from "./config";

const HEADER = "TYPENET";

function p(from: string, message: string) {
    if (Config.debugEnabled()) print(`[${HEADER}:${from}] ${message}`);
}
function w(from: string, message: string) {
    warn(`[${HEADER}:${from}] ${message}`);
}
function e(from: string, message: string) {
    error(`[${HEADER}:${from}] ${message}`);
}

const Logger = {
    print: p,
    error: e,
    warn: w,
};

export default Logger;
