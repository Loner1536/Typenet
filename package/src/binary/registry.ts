// Internal
import type * as Type from "@type";

const byName = new Map<string, Type.Pool.Entry>();
const byId = new Map<number, Type.Pool.Entry>();

let finalized = false;
let index = 1;

function register(name: string, codec: Type.Codec.Internal<unknown>) {
    if (byName.has(name)) {
        return; // TODO: Add logging
    }

    const id = index++;

    const entry = {
        id,
        name,
        codec,
    } satisfies Type.Pool.Entry;

    byName.set(name, entry);
    byId.set(id, entry);
}

function setHandler(name: string, handler: Type.Pool.Handler<unknown>) {
    const entry = byName.get(name);
    if (!entry) {
        return; // TODO: Add logging
    }

    const updated = { ...entry, handler };
    byName.set(name, updated);
    byId.set(entry.id, updated);
}

function fromName(name: string) {
    const entry = byName.get(name);
    if (!entry) return; // TODO: Add logging
    return entry;
}

function fromId(id: number) {
    const entry = byId.get(id);
    if (!entry) return; // TODO: Add logging
    return entry;
}

function finalize() {
    if (finalized) return;
    finalized = true;
}

const Registry = {
    finalize,

    register,

    setHandler,
    fromName,
    fromId,
};

export default Registry;
