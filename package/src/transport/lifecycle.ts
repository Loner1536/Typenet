// Package
import { Players } from "@rbxts/services";

// Internal
import { IS_SERVER } from "@environment";
import Report from "@security/report";

type ReadyCallback = (player: Player) => void;
type LeaveCallback = (player: Player) => void;

const readyPlayers = new Set<Player>();
const readyCallbacks: ReadyCallback[] = [];
const leaveCallbacks: LeaveCallback[] = [];

let started = false;

function markReady(player: Player) {
    if (readyPlayers.has(player)) {
        Report.log("warn", "LIFECYCLE_ALREADY_READY", { player });
        return;
    }
    readyPlayers.add(player);
    Report.log("debug", "LIFECYCLE_PLAYER_READY", { player });

    for (const cb of readyCallbacks) {
        cb(player);
    }
}

function markNotReady(player: Player) {
    if (!readyPlayers.has(player)) return;
    readyPlayers.delete(player);
    Report.log("debug", "LIFECYCLE_PLAYER_NOT_READY", { player });
}

function isReady(player: Player): boolean {
    return readyPlayers.has(player);
}

function onReady(callback: ReadyCallback) {
    readyCallbacks.push(callback);
}

function onLeave(callback: LeaveCallback) {
    leaveCallbacks.push(callback);
}

function start() {
    if (!IS_SERVER) return;

    if (started) {
        Report.log("warn", "LIFECYCLE_ALREADY_STARTED");
        return;
    }
    started = true;

    Players.PlayerRemoving.Connect((player) => {
        markNotReady(player);
        Report.log("debug", "LIFECYCLE_PLAYER_LEFT", { player });
        for (const cb of leaveCallbacks) {
            cb(player);
        }
    });
}

const Lifecycle = {
    start,
    markReady,
    markNotReady,
    isReady,
    onReady,
    onLeave,
};

export default Lifecycle;
