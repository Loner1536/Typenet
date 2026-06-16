// Package
import { ReplicatedStorage, RunService } from "@rbxts/services";

// Internal
import Constant from "@constant";

// Binary
import Reader from "@binary/reader";

const IS_SERVER = RunService.IsServer();

type ServerHandler = (player: Player, reader: Reader) => void;
type ClientHandler = (reader: Reader) => void;

const handlers = new Map<number, ServerHandler | ClientHandler>();

let reliableRemote!: RemoteEvent;
let unreliableRemote!: UnreliableRemoteEvent;

function getWait<K extends keyof CreatableInstances>(
    instance: Instance,
    name: string,
    key: K,
): CreatableInstances[K] {
    let existing: Instance | undefined;
    if (IS_SERVER) existing = instance.FindFirstChild(name) as Instance | undefined;
    else existing = instance.WaitForChild(name) as Instance;

    if (existing) return existing as CreatableInstances[K];

    const n = new Instance(key);
    n.Name = name;
    n.Parent = instance;
    return n;
}

function dispatch(player: Player | undefined, data: buffer) {
    const reader = new Reader(data);
    const id = reader.u8();

    const handler = handlers.get(id);

    if (!handler) return warn(`[Bridge] No handler for packet ID ${id}`);
    if (IS_SERVER) {
        (handler as ServerHandler)(player!, reader);
    } else {
        (handler as ClientHandler)(reader);
    }
}

function start() {
    const folder = getWait(ReplicatedStorage, Constant.NAME_FOLDER, "Folder");
    reliableRemote = getWait(folder, Constant.RELIABLE_NAME, "RemoteEvent");
    unreliableRemote = getWait(folder, Constant.UNRELIABLE_NAME, "UnreliableRemoteEvent");

    if (IS_SERVER) {
        reliableRemote.OnServerEvent.Connect((player, data) => dispatch(player, data as buffer));
        unreliableRemote.OnServerEvent.Connect((player, data) => dispatch(player, data as buffer));
    } else {
        reliableRemote.OnClientEvent.Connect((data) => dispatch(undefined, data));
        unreliableRemote.OnClientEvent.Connect((data) => dispatch(undefined, data));
    }
}

function listen(id: number, handler: ServerHandler | ClientHandler) {
    if (handlers.has(id)) warn(`[Bridge] Overwriting handler for packet ID ${id}`);
    handlers.set(id, handler);
}

function fireClient(target: Player | Player[] | "All", data: buffer, unreliable = false) {
    if (target === "All") {
        if (unreliable) unreliableRemote.FireAllClients(data);
        else reliableRemote.FireAllClients(data);
    } else if (typeIs(target, "Instance")) {
        if (unreliable) unreliableRemote.FireClient(target, data);
        else reliableRemote.FireClient(target, data);
    } else {
        for (const player of target as Player[]) {
            if (unreliable) unreliableRemote.FireClient(player, data);
            else reliableRemote.FireClient(player, data);
        }
    }
}

function fireServer(data: buffer, unreliable = false) {
    if (unreliable) unreliableRemote.FireServer(data);
    else reliableRemote.FireServer(data);
}

const Bridge = { start, listen, fireClient, fireServer };
export default Bridge;
