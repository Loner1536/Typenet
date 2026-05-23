type Handler = (player: Player, buffer: buffer) => void;

const handlers = new Map<number, Handler>();
let nextId = 0;

export function register(handler: Handler): number {
	const id = nextId++;
	handlers.set(id, handler);
	return id;
}

export function resolve(id: number): Handler | undefined {
	return handlers.get(id);
}
