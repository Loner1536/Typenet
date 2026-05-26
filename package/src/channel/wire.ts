// Package
import { ReplicatedStorage, RunService } from "@rbxts/services";

const FOLDER_NAME = "__TYPENET__";
const RELIABLE_NAME = "__RELIABLE__";
const UNRELIABLE_NAME = "__UNRELIABLE__";

const IS_SERVER = RunService.IsServer();

let _reliable: RemoteEvent;
let _unreliable: UnreliableRemoteEvent;

if (IS_SERVER) {
    const folder = new Instance("Folder");
    folder.Name = FOLDER_NAME;
    folder.Parent = ReplicatedStorage;

    const reliable = new Instance("RemoteEvent");
    reliable.Name = RELIABLE_NAME;
    reliable.Parent = folder;

    const unreliable = new Instance("UnreliableRemoteEvent");
    unreliable.Name = UNRELIABLE_NAME;
    unreliable.Parent = folder;

    _reliable = reliable;
    _unreliable = unreliable;
} else {
    const folder = ReplicatedStorage.WaitForChild(FOLDER_NAME);
    _reliable = folder.WaitForChild(RELIABLE_NAME) as RemoteEvent;
    _unreliable = folder.WaitForChild(UNRELIABLE_NAME) as UnreliableRemoteEvent;
}

export function reliable() {
    return _reliable;
}

export function unreliable() {
    return _unreliable;
}
