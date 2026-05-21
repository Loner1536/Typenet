// Package
import { RunService } from "@rbxts/services";

// Net
import { defineEvent, defineFunc, createNamespace } from "./net/namespace";
import { measure, measureDirect } from "./net/measure";

// Codec
import * as t from "./codec";

export type { InternalCodec as Codec } from "./types";
export { t };

// ---------------------------------------------------------------------------
// Net.start()
// ---------------------------------------------------------------------------

let started = false;

function start(): void {
	assert(!started, "[Net] Already started");
	started = true;

	if (RunService.IsServer()) {
		const server = import("./transport/server");
		server.andThen((ctx) => ctx.start());
	} else {
		const client = import("./transport/client");
		client.andThen((ctx) => ctx.start());
	}
}

// ---------------------------------------------------------------------------
// Net
// ---------------------------------------------------------------------------

const Net = {
	start,
	event: defineEvent,
	func: defineFunc,
	namespace: createNamespace,
	measure,
	measureDirect,
};

export default Net;
