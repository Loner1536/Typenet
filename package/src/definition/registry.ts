// Debug
import Logger from "../debug/logger";

const FROM = "Registry";

const entries = new Map<string, number>();
const byId = new Map<number, string>();
let nextId = 1;

export function register(name: string): number {
    if (entries.has(name)) {
        Logger.error(FROM, `"${name}" is already registered`);
    }

    const id = nextId++;
    entries.set(name, id);
    byId.set(id, name);

    Logger.print(FROM, `Registered "${name}" with id ${id}`);

    return id;
}

export function getById(id: number): string | undefined {
    return byId.get(id);
}

export function getByName(name: string): number | undefined {
    return entries.get(name);
}

export function reset(): void {
    entries.clear();
    byId.clear();
    nextId = 1;

    Logger.print(FROM, "Reset");
}
