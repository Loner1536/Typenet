// Root
import * as Types from "../types";

const config = {
    debug: false,
    stats: false,
};

function debugEnabled() {
    return config.debug === true;
}
function statsEnabled() {
    return config.stats === true;
}
function set(options: Types.Options) {
    if (options.debug !== undefined) config.debug = options.debug;
    if (options.stats !== undefined) config.stats = options.stats;
}

const Config = {
    debugEnabled,
    statsEnabled,

    set,
};

export default Config;
