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

    _reliable = new Instance("RemoteEvent");
    _reliable.Name = RELIABLE_NAME;
    _reliable.Parent = folder;

    _unreliable = new Instance("UnreliableRemoteEvent");
    _unreliable.Name = UNRELIABLE_NAME;
    _unreliable.Parent = folder;
} else {
    const folder = ReplicatedStorage.WaitForChild(FOLDER_NAME);
    _reliable = folder.WaitForChild(RELIABLE_NAME) as RemoteEvent;
    _unreliable = folder.WaitForChild(UNRELIABLE_NAME) as UnreliableRemoteEvent;
}

export function reliable(): RemoteEvent {
    return _reliable;
}

export function unreliable(): UnreliableRemoteEvent {
    return _unreliable;
}
