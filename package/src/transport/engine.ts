//!optimize 2
//!native

// Package
import { RunService } from "@rbxts/services";

// Transport
import Outbound from "./outbound";

// Security
import Report from "@security/report";

let running = false;
let connection: RBXScriptConnection | undefined;

function start() {
    if (running) {
        Report.log("warn", "ENGINE_ALREADY_RUNNING");
        return;
    }
    running = true;

    connection = RunService.Heartbeat.Connect((_dt) => Outbound.flush());
}

function stop() {
    if (connection) {
        connection.Disconnect();
        connection = undefined;
    }
    running = false;
}

const Engine = {
    start,
    stop,
};

export default Engine;
