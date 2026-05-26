export let debug = false;
export let stats = false;

export function configure(options: { debug?: boolean; stats?: boolean }) {
    if (options.debug !== undefined) debug = options.debug;
    if (options.stats !== undefined) stats = options.stats;
}
