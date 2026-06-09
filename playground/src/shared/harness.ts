// // Package
// import { RunService, Stats } from "@rbxts/services";
//
// interface Result {
//     fps: number;
//     p50: number;
// }
// interface Entry {
//     label: string;
//     fires: number;
//     lync: Result;
//     typenet: Result;
// }
// interface Queued {
//     label: string;
//     fires: number;
//     secs: number;
//     lPool: defined[][];
//     lSend: (d: defined[]) => void;
//     tnPool: defined[][];
//     tnSend: (d: defined[]) => void;
// }
//
// const queue: Queued[] = [];
// const log: Entry[] = [];
//
// const PFXW = 12;
// const FPSW = 7;
// const KBW = 10;
// const BW = 6;
// const COL_W = PFXW + FPSW + 1 + 2 + KBW + 1 + 2 + BW + 1;
//
// function rpad(s: string, w: number) {
//     return s + string.rep(" ", math.max(0, w - s.size()));
// }
//
// function win(better: boolean, worse: boolean) {
//     return better ? "✓" : worse ? "✗" : " ";
// }
//
// function block(r: Entry): string[] {
//     const lPfx = "  ├ Lync    ";
//     const tPfx = "  └ Typenet ";
//
//     const lB = math.round((r.lync.p50 * 125) / (r.lync.fps * r.fires));
//     const tB = math.round((r.typenet.p50 * 125) / (r.typenet.fps * r.fires));
//
//     const lLine =
//         lPfx +
//         rpad(tostring(r.lync.fps) + "fps", FPSW) +
//         " " +
//         "  " +
//         rpad(string.format("%.1f", r.lync.p50) + "kb", KBW) +
//         " " +
//         "  " +
//         rpad(tostring(lB) + "B", BW) +
//         " ";
//
//     const tLine =
//         tPfx +
//         rpad(tostring(r.typenet.fps) + "fps", FPSW) +
//         win(r.typenet.fps > r.lync.fps, r.typenet.fps < r.lync.fps) +
//         "  " +
//         rpad(string.format("%.1f", r.typenet.p50) + "kb", KBW) +
//         win(r.typenet.p50 < r.lync.p50, r.typenet.p50 > r.lync.p50) +
//         "  " +
//         rpad(tostring(tB) + "B", BW) +
//         win(tB < lB, tB > lB);
//
//     return [rpad(r.label, COL_W), lLine, tLine];
// }
//
// function measure(
//     fires: number,
//     secs: number,
//     pool: defined[][],
//     send: (d: defined[]) => void,
// ): Result {
//     const kb: number[] = [];
//     const fp: number[] = [];
//     const n = pool.size();
//
//     let cursor = 0;
//     let secFrames = 0;
//     let elapsed = 0;
//
//     const c = RunService.Heartbeat.Connect((dt) => {
//         secFrames++;
//         elapsed += dt;
//
//         for (let i = 0; i < fires; i++) {
//             send(pool[cursor % n]);
//             cursor++;
//         }
//
//         if (elapsed >= 1) {
//             kb.push(Stats.DataSendKbps);
//             fp.push(secFrames);
//             secFrames = 0;
//             elapsed = 0;
//         }
//     });
//
//     task.wait(secs);
//     c.Disconnect();
//     task.wait(1);
//     kb.sort();
//     fp.sort();
//
//     const p = (a: number[], pct: number) => a[math.max(0, math.ceil(a.size() * pct) - 1)] ?? 0;
//     return { fps: p(fp, 0.5), p50: p(kb, 0.5) };
// }
//
// function drain() {
//     const t = os.clock() + 6;
//     while (Stats.DataSendKbps > 10 && os.clock() < t) RunService.Heartbeat.Wait();
//     task.wait(2);
// }
//
// export function bench(
//     label: string,
//     fires: number,
//     secs: number,
//     lPool: defined[][],
//     lSend: (d: defined[]) => void,
//     tnPool: defined[][],
//     tnSend: (d: defined[]) => void,
// ) {
//     queue.push({ label, fires, secs, lPool, lSend, tnPool, tnSend });
// }
//
// export function run() {
//     const typenetResults: Result[] = [];
//     const lyncResults: Result[] = [];
//
//     print(`── TYPENET (${queue.size()} benches) ──`);
//     for (const q of queue) {
//         print(`  → ${q.label}`);
//         typenetResults.push(measure(q.fires, q.secs, q.tnPool, q.tnSend));
//         task.wait(2);
//     }
//
//     print(`── LYNC (${queue.size()} benches) ──`);
//     for (const q of queue) {
//         print(`  → ${q.label}`);
//         lyncResults.push(measure(q.fires, q.secs, q.lPool, q.lSend));
//         task.wait(2);
//     }
//
//     for (let i = 0; i < queue.size(); i++) {
//         log.push({
//             label: queue[i].label,
//             fires: queue[i].fires,
//             lync: lyncResults[i],
//             typenet: typenetResults[i],
//         });
//     }
//
//     drain();
//     summary();
// }
//
// export function summary() {
//     const W = COL_W * 4 + 3 * 2;
//     print(`── RESULTS ──${string.rep("─", W - 13)}`);
//     for (let i = 0; i < log.size(); i += 4) {
//         const group: string[][] = [];
//         for (let j = 0; j < 4; j++)
//             group[j] =
//                 log[i + j] !== undefined
//                     ? block(log[i + j])
//                     : [rpad("", COL_W), rpad("", COL_W), rpad("", COL_W)];
//         for (let line = 0; line < 3; line++)
//             print(
//                 group[0][line] +
//                 "  " +
//                 group[1][line] +
//                 "  " +
//                 group[2][line] +
//                 "  " +
//                 group[3][line],
//             );
//     }
//     print(string.rep("─", W));
// }
