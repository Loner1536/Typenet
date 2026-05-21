// Package
import { RunService, ReplicatedStorage } from "@rbxts/services";
import { Stats } from "@rbxts/services";
import Object from "@rbxts/object-utils";
import Lync from "@rbxts/lync";
import Net from "@rbxts/net";

// Shared
import Network from "@shared/network";
import {
	boolArrayPool,
	boolPool,
	entityPool,
	stringPool,
	MAX_FPF,
	POOL_SIZE,
	type Entity,
	type ReceivedMap,
} from "@shared/benches";

Lync.start();
Net.start();

Network.Net.Test.request("Hello");
Network.Lync.Test.request("Hello");

const DURATION = 10;

type BenchResult = { sent: number; bandwidth: number[]; framerates: number[] };
type ToolResults = Record<string, BenchResult>;
type AllResults = Record<string, ToolResults>;

// ── Spec ──────────────────────────────────────────────────────────────────────

type BenchSpec = {
	netFire: (d: defined) => void;
	netBytes: () => number;
	lyncFire: (d: defined) => void;
	lyncBytes: () => number;
	pool: defined[];
};

function makeSpecs(): Record<string, BenchSpec> {
	let netBoolArrayBytes = 0;
	let netBoolBytes = 0;
	let netStructArrayBytes = 0;
	let netStrBytes = 0;

	return {
		"bool[]": {
			netFire: (d) => {
				netBoolArrayBytes += Net.measureDirect(Network.Net.BoolArray.codec!, d);
				Network.Net.BoolArray.fireServer(d as boolean[]);
			},
			netBytes: () => netBoolArrayBytes,
			lyncFire: (d) => Network.Lync.BoolArray.send(d as boolean[]),
			lyncBytes: () => Network.Lync.BoolArray.stats().bytesSent,
			pool: boolArrayPool as unknown as defined[],
		},
		bool: {
			netFire: (d) => {
				netBoolBytes += Net.measureDirect(Network.Net.Bool.codec!, d);
				Network.Net.Bool.fireServer(d as boolean);
			},
			netBytes: () => netBoolBytes,
			lyncFire: (d) => Network.Lync.Bool.send(d as boolean),
			lyncBytes: () => Network.Lync.Bool.stats().bytesSent,
			pool: boolPool as unknown as defined[],
		},
		"struct[]": {
			netFire: (d) => {
				netStructArrayBytes += Net.measureDirect(Network.Net.StructArray.codec!, d);
				Network.Net.StructArray.fireServer(d as Entity[]);
			},
			netBytes: () => netStructArrayBytes,
			lyncFire: (d) => Network.Lync.StructArray.send(d as Entity[]),
			lyncBytes: () => Network.Lync.StructArray.stats().bytesSent,
			pool: entityPool as unknown as defined[],
		},
		string: {
			netFire: (d) => {
				netStrBytes += Net.measureDirect(Network.Net.Str.codec!, d);
				Network.Net.Str.fireServer(d as string);
			},
			netBytes: () => netStrBytes,
			lyncFire: (d) => Network.Lync.Str.send(d as string),
			lyncBytes: () => Network.Lync.Str.stats().bytesSent,
			pool: stringPool as unknown as defined[],
		},
	};
}

// ── Baseline ──────────────────────────────────────────────────────────────────

function measureBaseline(): Promise<{ send: number }> {
	return new Promise((resolve) => {
		print("Measuring baseline...");
		task.wait(3);
		const samples: number[] = [];
		let acc = 0;
		const conn = RunService.Heartbeat.Connect((dt) => {
			acc += dt;
			if (acc >= 1) {
				acc -= 1;
				samples.push(Stats.DataSendKbps);
			}
		});
		task.wait(5);
		conn.Disconnect();
		const avg = samples.reduce((s, v) => s + v, 0) / math.max(samples.size(), 1);
		resolve({ send: avg * 1.5 + 1 });
	});
}

// ── Simultaneous runner ───────────────────────────────────────────────────────

type Acc = {
	sent: number;
	lastBytes: number;
	fps: number;
	elapsed: number;
	kbps: number[];
	framerates: number[];
};

function runAll(specs: Record<string, BenchSpec>): AllResults {
	const accs: Record<string, { Net: Acc; Lync: Acc }> = {};

	for (const [label, spec] of Object.entries(specs)) {
		accs[label] = {
			Net: { sent: 0, lastBytes: spec.netBytes(), fps: 0, elapsed: 0, kbps: [], framerates: [] },
			Lync: { sent: 0, lastBytes: spec.lyncBytes(), fps: 0, elapsed: 0, kbps: [], framerates: [] },
		};
	}

	let frame = 0;
	const n = POOL_SIZE;

	const conn = RunService.Heartbeat.Connect((dt) => {
		frame += 1;

		for (const [label, spec] of Object.entries(specs)) {
			const { Net: na, Lync: la } = accs[label];

			for (let i = 1; i <= MAX_FPF; i++) {
				const item = spec.pool[(frame * 105 + i) % n];
				na.sent += 1;
				spec.netFire(item);
				la.sent += 1;
				spec.lyncFire(item);
			}

			na.elapsed += dt;
			if (na.elapsed >= 1) {
				const now = spec.netBytes();
				na.kbps.push(((now - na.lastBytes) * 8) / 1000);
				na.lastBytes = now;
				na.framerates.push(na.fps);
				na.fps = 0;
				na.elapsed = 0;
			} else {
				na.fps += 1;
			}

			la.elapsed += dt;
			if (la.elapsed >= 1) {
				const now = spec.lyncBytes();
				la.kbps.push(((now - la.lastBytes) * 8) / 1000);
				la.lastBytes = now;
				la.framerates.push(la.fps);
				la.fps = 0;
				la.elapsed = 0;
			} else {
				la.fps += 1;
			}
		}
	});

	task.wait(DURATION);
	conn.Disconnect();

	const results: AllResults = {};
	for (const [label] of Object.entries(specs)) {
		const { Net: na, Lync: la } = accs[label];
		na.kbps.sort((a, b) => a < b);
		na.framerates.sort((a, b) => a < b);
		la.kbps.sort((a, b) => a < b);
		la.framerates.sort((a, b) => a < b);
		results[label] = {
			Net: { sent: na.sent, bandwidth: na.kbps, framerates: na.framerates },
			Lync: { sent: la.sent, bandwidth: la.kbps, framerates: la.framerates },
		};
	}
	return results;
}

// ── Print ─────────────────────────────────────────────────────────────────────

function percentile(samples: number[], pct: number): number {
	const idx = math.max(math.floor(samples.size() * (pct / 100)), 1) - 1;
	return samples[idx] ?? 0;
}

function printResults(results: AllResults, received: ReceivedMap) {
	const sep = "=".rep(64);
	print(`\n${sep}`);
	print(`  BENCHMARK RESULTS (Client → Server, ${MAX_FPF} fires/frame, ${DURATION}s)`);
	print(sep);
	for (const [bench, tools] of Object.entries(results)) {
		print(`\n  ${bench}`);
		print("  ┌──────────────┬───────┬────────────┬──────────┐");
		print("  │ Tool         │  FPS  │    Kbps    │   Loss   │");
		print("  ├──────────────┼───────┼────────────┼──────────┤");
		for (const [tool, data] of Object.entries(tools)) {
			const fps = percentile(data.framerates, 50);
			const kbps = percentile(data.bandwidth, 50);
			const recv = received[bench]?.[tool] ?? 0;
			const loss = data.sent > 0 ? string.format("%.1f%%", (1 - recv / data.sent) * 100) : "N/A";
			print(string.format("  │ %-12s │ %5d │ %10.2f │ %8s │", tool, fps, kbps, loss));
		}
		print("  └──────────────┴───────┴────────────┴──────────┘");
	}
	print("");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
	const baseline = await measureBaseline();
	const specs = makeSpecs();

	print("> Running all benchmarks simultaneously...");
	const allResults = runAll(specs);

	const GetReceived = ReplicatedStorage.WaitForChild("GetReceived") as RemoteFunction;
	const received = GetReceived.InvokeServer() as ReceivedMap;

	print("Finished!");
	printResults(allResults, received);
}

main();
