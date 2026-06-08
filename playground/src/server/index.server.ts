// Package
import { Players } from "@rbxts/services";
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

// Register handler FIRST
let clientReady = false;
handshake.ClientReady.on(() => {
    clientReady = true;
});

// Wait for player
const players = Players.GetPlayers();
const player = players.size() > 0 ? players[0] : Players.PlayerAdded.Wait()[0];

// Give client time to finish Typenet handshake
task.wait(2);

// Then signal client
handshake.ServerCpuDone.send(true, player);

// Now wait
while (!clientReady) task.wait(0.1);

// ── Blink-comparable s2c ─────────────────────────────────────────────────

Harness.header(`s2c ${bench.blinkFiresPerFrame} fires/frame ${bench.blinkSeconds}s`);

for (const c of blinkCases) {
    Harness.throughputCompare(
        c.label,
        bench.blinkFiresPerFrame,
        bench.blinkSeconds,
        c.typenet.pool,
        (d) => c.typenet.send(d, player),
        c.lync.pool,
        (d) => c.lync.send(d, player),
    );
    task.wait(5);
}

// ── Extended s2c ─────────────────────────────────────────────────────────

Harness.header(`Extended s2c ${bench.extendedFiresPerFrame} fires/frame ${bench.extendedSeconds}s`);

for (const c of extendedCases) {
    Harness.throughputCompare(
        c.label,
        bench.extendedFiresPerFrame,
        bench.extendedSeconds,
        c.typenet.pool,
        (d) => c.typenet.send(d, player),
        c.lync.pool,
        (d) => c.lync.send(d, player),
    );
    task.wait(5);
}

let clientDone = false;
handshake.ClientDone.on(() => {
    clientDone = true;
});

handshake.ServerSwap.send(true, player);

while (!clientDone) task.wait(0.1);

Harness.header("Done");
