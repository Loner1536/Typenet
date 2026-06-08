// Internal
import * as Type from "@type";

// Security
import Report from "@security/report";

export interface Definition {
    id: number;
    name: string;
    codec: Type.Codec.Internal<unknown> | undefined;
    handler: ((player: Player, data: unknown) => void) | undefined;
    unreliable: boolean;
}

const byName = new Map<string, Definition>();
const byId = new Map<number, Definition>();
const pending: Definition[] = [];

let finalized = false;

function register(
    name: string,
    codec: Type.Codec.Internal<unknown> | undefined,
    unreliable: boolean,
): Definition {
    if (finalized) {
        Report.log("fatal", "REGISTRY_ALREADY_FINALIZED", { name });
    }

    if (byName.has(name)) {
        Report.log("fatal", "REGISTRY_DUPLICATE_NAME", { name });
    }

    const def: Definition = {
        id: 0,
        name,
        codec,
        handler: undefined,
        unreliable,
    };

    byName.set(name, def);
    pending.push(def);

    return def;
}

function finalize() {
    if (finalized) return;
    finalized = true;

    pending.sort((a, b) => a.name < b.name);

    let nextId = 1;
    for (const def of pending) {
        def.id = nextId++;
        byId.set(def.id, def);
    }

    pending.clear();
}

function setHandler(name: string, handler: (player: Player, data: unknown) => void) {
    const def = byName.get(name);
    if (def === undefined) {
        Report.log("warn", "REGISTRY_HANDLER_FOR_UNKNOWN", { name });
        return;
    }
    def.handler = handler;
}

function getById(id: number): Definition | undefined {
    return byId.get(id);
}

function getByName(name: string): Definition | undefined {
    return byName.get(name);
}

const Registry = {
    register,
    finalize,
    setHandler,
    getById,
    getByName,
};

export default Registry;
