// Package
import { RunService } from "@rbxts/services";

const queued = new Array<string>();

let started = false;

function queue(name: string) {
    queued.push(name);
}

function flush() { }

function start() {
    if (started) {
        return; // TODO: Add logging
    }

    RunService.Heartbeat.Connect((_) => flush());
}

const Engine = {
    start,
    queue,
};

export default Engine;
