// Root
import Logger from "../debug/logger";

const FROM = "Registry";

export type Entry = {
    id: number;
    name: string;
};

const entries = new Map<string, Entry>();
const byId = new Map<number, Entry>();
let nextId = 1;

export function register(name: string): number {
    if (entries.has(name)) {
        Logger.error(FROM, `Packet "${name}" is already registered`);
    }

    const id = nextId++;
    const entry: Entry = { id, name };

    entries.set(name, entry);
    byId.set(id, entry);

    Logger.print(FROM, `Registered "${name}" with id ${id}`);

    return id;
}

export function getById(id: number): Entry | undefined {
    return byId.get(id);
}

export function getByName(name: string): Entry | undefined {
    return entries.get(name);
}

export function reset(): void {
    entries.clear();
    byId.clear();
    nextId = 1;

    Logger.print(FROM, "Reset");
}

export default {
    register,

    getByName,
    getById,

    reset,
};
