// Root
import * as Types from "../types";

const config = {
    debug: false,
    stats: false,
};

export function configure(options: Types.Options) {
    if (options.debug !== undefined) config.debug = options.debug;
    if (options.stats !== undefined) config.stats = options.stats;
}

export function isDebug() {
    return config.debug;
}

export function isStats() {
    return config.stats;
}
