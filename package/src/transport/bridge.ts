// Package
import { Players, ReplicatedStorage } from "@rbxts/services";

// Internal
import { IS_SERVER } from "@environment";
import Constant from "@constant";
import * as Type from "@type";

// Security
import Report from "@security/report";

// Utility
import resolveTarget from "@utility/resolve-target";

type ReceiveCallback = (player: Player, buf: buffer) => void;

let reliable: RemoteEvent;
let unreliable: UnreliableRemoteEvent;

let started = false;

let receiveCallback: ReceiveCallback | undefined;

function start() {
    if (started) return;

    if (IS_SERVER) {
        const folder = new Instance("Folder");
        folder.Name = Constant.FOLDER_NAME;
        folder.Parent = ReplicatedStorage;

        reliable = new Instance("RemoteEvent");
        reliable.Name = Constant.RELIABLE_NAME;
        reliable.Parent = folder;

        unreliable = new Instance("UnreliableRemoteEvent");
        unreliable.Name = Constant.UNRELIABLE_NAME;
        unreliable.Parent = folder;

        reliable.OnServerEvent.Connect((player, buf) => {
            if (buffer.len(buf as buffer) === 0) {
                Report.log("warn", "BRIDGE_EMPTY_BUFFER", { player });
                return;
            }
            if (receiveCallback !== undefined) {
                receiveCallback(player, buf as buffer);
            }
        });

        unreliable.OnServerEvent.Connect((player, buf) => {
            if (buffer.len(buf as buffer) === 0) {
                Report.log("warn", "BRIDGE_EMPTY_BUFFER", { player });
                return;
            }
            if (receiveCallback !== undefined) {
                receiveCallback(player, buf as buffer);
            }
        });

        Report.log("debug", "BRIDGE_STARTED_SERVER");
    } else {
        const folder = ReplicatedStorage.WaitForChild(Constant.FOLDER_NAME) as Folder;
        if (!folder) Report.log("fatal", "BRIDGE_FOLDER_NOT_FOUND");

        reliable = folder.WaitForChild(Constant.RELIABLE_NAME) as RemoteEvent;
        if (!reliable) Report.log("fatal", "BRIDGE_RELIABLE_EVENT_NOT_FOUND");

        unreliable = folder.WaitForChild(Constant.UNRELIABLE_NAME) as UnreliableRemoteEvent;
        if (!unreliable) Report.log("fatal", "BRIDGE_UNRELIABLE_EVENT_NOT_FOUND");

        reliable.OnClientEvent.Connect((buf) => {
            if (receiveCallback !== undefined) {
                receiveCallback(Players.LocalPlayer, buf as buffer);
            }
        });

        unreliable.OnClientEvent.Connect((buf) => {
            if (receiveCallback !== undefined) {
                receiveCallback(Players.LocalPlayer, buf as buffer);
            }
        });

        Report.log("debug", "BRIDGE_STARTED_CLIENT");
    }

    started = true;
}

function onReceive(callback: ReceiveCallback) {
    if (receiveCallback !== undefined) {
        Report.log("warn", "BRIDGE_RECEIVE_OVERRIDDEN");
    }
    receiveCallback = callback;
}

function fireReliable(target?: Type.Target, buf?: buffer) {
    if (IS_SERVER) {
        const players = resolveTarget(target);
        for (const player of players) {
            reliable.FireClient(player, buf);
        }
    } else {
        reliable.FireServer(buf);
    }
}

function fireUnreliable(target?: Type.Target, buf?: buffer) {
    if (IS_SERVER) {
        const players = resolveTarget(target);
        for (const player of players) {
            unreliable.FireClient(player, buf);
        }
    } else {
        unreliable.FireServer(buf);
    }
}

const Bridge = {
    start,
    onReceive,
    fireReliable,
    fireUnreliable,
};

export default Bridge;
