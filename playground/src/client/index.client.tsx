// Package
import Typenet from "@rbxts/typenet";
import Lync from "@rbxts/lync";

// Shared
import * as Harness from "@shared/harness";
import { blinkCases, extendedCases, handshake, bench } from "@shared/scenarios";

Typenet.start({ debug: false });
Lync.configure({ channelMaxSize: 1048576 });
Lync.start();

for (const c of blinkCases) {
    c.typenet.onRegister();
    c.lync.onRegister();
}
for (const c of extendedCases) {
    c.typenet.onRegister();
    c.lync.onRegister();
}

let serverReady = false;
handshake.ServerCpuDone.on(() => {
    serverReady = true;
});

let serverSwap = false;
handshake.ServerSwap.on(() => {
    serverSwap = true;
});

while (!serverReady) task.wait(0.1);
handshake.ClientReady.send(true);
while (!serverSwap) task.wait(0.1);

// ── Blink-comparable c2s ─────────────────────────────────────────────────

Harness.header(`c2s ${bench.blinkFiresPerFrame} fires/frame ${bench.blinkSeconds}s`);

for (const c of blinkCases) {
    Harness.throughputCompare(
        c.label,
        bench.blinkFiresPerFrame,
        bench.blinkSeconds,
        c.typenet.pool,
        (d) => c.typenet.send(d),
        c.lync.pool,
        (d) => c.lync.send(d),
    );
    task.wait(5);
}

// ── Extended c2s ─────────────────────────────────────────────────────────

Harness.header(`Extended c2s ${bench.extendedFiresPerFrame} fires/frame ${bench.extendedSeconds}s`);

for (const c of extendedCases) {
    Harness.throughputCompare(
        c.label,
        bench.extendedFiresPerFrame,
        bench.extendedSeconds,
        c.typenet.pool,
        (d) => c.typenet.send(d),
        c.lync.pool,
        (d) => c.lync.send(d),
    );
    task.wait(5);
}

handshake.ClientDone.send(true);
Harness.header("Done");
