//!optimize 2

// Package
import { RunService, Stats } from "@rbxts/services";

const LABEL_W = 28;

function pct(sorted: number[], p: number): number {
    const i = math.max(1, math.floor((sorted.size() * p) / 100 + 0.5));
    return sorted[math.max(0, math.min(i - 1, sorted.size() - 1))];
}

export function header(title: string) {
    const bar = string.rep("=", 64);
    print(bar);
    print(string.rep(" ", math.max(0, math.floor((64 - title.size()) / 2))) + title);
    print(bar);
}

export function row(label: string, value: string) {
    const pad = string.rep(" ", math.max(0, LABEL_W - label.size()));
    print(`  ${label}${pad} ${value}`);
}

export function throughputCompare(
    label: string,
    firesPerFrame: number,
    seconds: number,
    typenetPool: defined[][],
    typenetSend: (d: defined[]) => void,
    lyncPool: defined[][],
    lyncSend: (d: defined[]) => void,
) {
    const tnResult = runThroughput(firesPerFrame, seconds, typenetPool, typenetSend);
    task.wait(5);

    const lyResult = runThroughput(firesPerFrame, seconds, lyncPool, lyncSend);
    task.wait(5);

    // Print
    print(`\n  ${label}`);
    print("  ┌──────────────┬───────┬────────────┬────────────┐");
    print("  │ Tool         │  FPS  │  Kbps P50  │  Kbps P95  │");
    print("  ├──────────────┼───────┼────────────┼────────────┤");
    print(
        `  │ typenet      │ ${string.format("%5d", tnResult.fps)} │ ${string.format("%10.2f", tnResult.p50)} │ ${string.format("%10.2f", tnResult.p95)} │`,
    );
    print(
        `  │ lync         │ ${string.format("%5d", lyResult.fps)} │ ${string.format("%10.2f", lyResult.p50)} │ ${string.format("%10.2f", lyResult.p95)} │`,
    );
    print("  └──────────────┴───────┴────────────┴────────────┘");
}

function runThroughput(
    firesPerFrame: number,
    seconds: number,
    pool: defined[][],
    send: (d: defined[]) => void,
): { fps: number; p50: number; p95: number } {
    const fps: number[] = [];
    const kbps: number[] = [];
    let frames = 0;
    let elapsed = 0;
    const n = pool.size();

    const conn = RunService.Heartbeat.Connect((dt) => {
        frames++;
        elapsed += dt;
        for (let i = 1; i <= firesPerFrame; i++) {
            send(pool[(frames * 105 + i) % n]);
        }
        if (elapsed >= 1) {
            kbps.push(Stats.DataSendKbps);
            fps.push(frames);
            frames = 0;
            elapsed = 0;
        }
    });

    task.wait(seconds);
    conn.Disconnect();

    const timeout = os.clock() + 15;
    while (Stats.DataSendKbps > 10 && os.clock() < timeout) {
        RunService.Heartbeat.Wait();
    }
    task.wait(2);

    fps.sort();
    kbps.sort();

    return {
        fps: fps.size() > 0 ? math.floor(pct(fps, 50) + 0.5) : 0,
        p50: kbps.size() > 0 ? pct(kbps, 50) : 0,
        p95: kbps.size() > 0 ? pct(kbps, 95) : 0,
    };
}
