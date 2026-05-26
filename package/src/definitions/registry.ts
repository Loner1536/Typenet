// Debug
import { isStats } from "../debug/config";
import Logger from "../debug/logger";
import Stats from "../debug/stats";

const FROM = "Registry";

export type Entry = {
    id: number;
    name: string;
};

const entries = new Map<string, Entry>();
const stats = new Map<string, Stats>();
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

export function getStats(name: string): Stats | undefined {
    return stats.get(name);
}

export function createStats() {
    if (!isStats()) return undefined;
    entries.forEach((_, key) => {
        const obj = new Stats();
        stats.set(key, obj);
    });
}

export function reset(): void {
    entries.clear();
    stats.clear();
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
