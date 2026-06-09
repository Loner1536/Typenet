//!optimize 2

// Package
import { RunService, Players } from "@rbxts/services";
import Typenet from "@rbxts/typenet";
import Lync from "@rbxts/lync";

// Shared
// import { blinkCases, extendedCases, bench as cfg, handshake } from "@shared/scenarios";
// import { bench, run } from "@shared/harness";

// // ── Start ─────────────────────────────────────────────────────────────────────
//
// Typenet.start({ debug: false });
Lync.configure({ channelMaxSize: 1048576 });
Lync.start();

// for (const c of blinkCases) {
//     c.typenet.onRegister();
//     c.lync.onRegister();
// }
// for (const c of extendedCases) {
//     c.typenet.onRegister();
//     c.lync.onRegister();
// }
//
// // ── Wait for client ───────────────────────────────────────────────────────────
//
// print("=== waiting for client ===");
// let clientReady = false;
// handshake.ClientReady.on(() => {
//     clientReady = true;
// });
//
// while (!clientReady) RunService.Heartbeat.Wait();
// print("=== client connected — benchmarking ===");
//
// const player = Players.GetPlayers()[0]!;
// task.wait(2);
//
// // ── Focused benches (losses only) ────────────────────────────────────────────
//
// const focused = [
//     "cframe_walking__delta",
//     "bool_arr_1000__1flip",
//     "entity_deltaArr_100__3mut",
//     "state_delta__1mut",
//     "vec3_walking__full",
//     "counter_int__full",
// ];
//
// // for (const c of blinkCases) {
// //     const pool = c.lync.pool.map((d) => [d] as defined[]);
// //     bench(c.label, cfg.blinkFiresPerFrame, cfg.blinkSeconds,
// //         pool, (d) => c.lync.send(d[0], player),
// //         pool, (d) => c.typenet.send(d[0], player));
// // }
//
// for (const c of extendedCases) {
//     if (!focused.includes(c.label)) continue;
//     const pool = c.lync.pool.map((d) => [d] as defined[]);
//     bench(
//         c.label,
//         cfg.extendedFiresPerFrame,
//         cfg.extendedSeconds,
//         pool,
//         (d) => c.lync.send(d[0], player),
//         pool,
//         (d) => c.typenet.send(d[0], player),
//     );
// }
//
// run();
// handshake.ServerCpuDone.send(true);
