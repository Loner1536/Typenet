// Package
import { RunService } from "@rbxts/services";

// Net
import { dispatchClient, dispatchClientDirect } from "./bridge";
import { createChannel, Channel } from "./channel";

const RS = game.GetService("ReplicatedStorage");
const REMOTE_FOLDER = "__Net__";

const INBOUND_NAME = "__S2C__";
const INBOUND_NAME_DIRECT = "__S2C_Direct__";

const OUTBOUND_NAME = "__C2S__";
const OUTBOUND_NAME_DIRECT = "__C2S_Direct__";

let outbound: RemoteEvent;
let outboundDirect: RemoteEvent;

let inbound: RemoteEvent;
let inboundDirect: RemoteEvent;

let channel: Channel;
let flushConnection: RBXScriptConnection | undefined;
let started = false;

export function writeToServer(remoteId: number, payload: buffer): void {
	channel.write(remoteId, payload);
}

export function writeToServerDirect(payload: buffer): void {
	outboundDirect.FireServer(payload);
}

export function start(): void {
	assert(!started, "[Net/client] Already started");
	started = true;

	channel = createChannel();

	const folder = RS.WaitForChild(REMOTE_FOLDER, 10) as Folder | undefined;
	assert(folder !== undefined, "[Net/client] Timed out waiting for __Net__ folder");

	inbound = folder!.WaitForChild(INBOUND_NAME, 10) as
		| RemoteEvent
		| undefined as unknown as RemoteEvent;
	assert(inbound !== undefined, "[Net/client] Timed out waiting for S2C remote");

	inboundDirect = folder!.WaitForChild(INBOUND_NAME_DIRECT, 10) as
		| RemoteEvent
		| undefined as unknown as RemoteEvent;
	assert(inboundDirect !== undefined, "[Net/client] Timed out waiting for S2C Direct remote");

	outbound = folder!.WaitForChild(OUTBOUND_NAME, 10) as
		| RemoteEvent
		| undefined as unknown as RemoteEvent;
	assert(outbound !== undefined, "[Net/client] Timed out waiting for C2S remote");

	outboundDirect = folder!.WaitForChild(OUTBOUND_NAME_DIRECT, 10) as
		| RemoteEvent
		| undefined as unknown as RemoteEvent;
	assert(outboundDirect !== undefined, "[Net/client] Timed out waiting for C2S Direct remote");

	inbound.OnClientEvent.Connect((data: unknown) => {
		if (typeIs(data, "buffer")) {
			dispatchClient(data);
		} else {
			warn("[Net/client] Non-buffer received from server");
		}
	});

	inboundDirect.OnClientEvent.Connect((data: unknown) => {
		if (typeIs(data, "buffer")) {
			dispatchClientDirect(data);
		} else {
			warn("[Net/client] Non-buffer received from server");
		}
	});

	flushConnection = RunService.Heartbeat.Connect((_dt: number) => {
		flush();
	});
}

export function flush(): void {
	const buf = channel.flush();
	if (buf !== undefined) {
		outbound.FireServer(buf);
	}
}

export function stop(): void {
	flushConnection?.Disconnect();
	flushConnection = undefined;
	started = false;
}

export function _reset(): void {
	stop();
	if (channel !== undefined) {
		channel.flush();
	}
}
