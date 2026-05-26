# Typenet

> A type-safe, batch-buffered networking library for Roblox, built with roblox-ts.

Heavily inspired by [Lync](https://github.com/Axp3cter/Lync/tree/main) — seeing how beautiful networking could be made me want to build something of my own. Blink and Zap never clicked for me, and while Tether was decent, I wanted something that felt truly clean. Lync showed me that was possible.

> **⚠️ Early Access** — Typenet is in very early development. The API is unstable and incomplete. Do not use in production.

---

## Features

- **Batch buffering** — packets are merged into a single buffer per heartbeat, minimizing remote event calls
- **Type-safe codecs** — fully typed encode/decode with a composable codec system
- **Channel grouping** — organize related packets into named channels
- **Per-packet stats** — track bytes sent, bytes received, drop rate, round trip time, and more
- **Reliable & unreliable** — choose per-packet whether to use reliable or unreliable transport

---

## Current Codecs

Typenet currently ships with the following codec primitives:

```ts
import { t } from "@rbxts/typenet";

t.unknown  -- raw unknown value
t.string   -- utf-8 string (up to 255 characters)
```

More primitives are coming as the library matures.

---

## Setup

Typenet needs to be started on both the server and client before any packets are sent or received.

**Server:**
```ts
import Typenet from "@rbxts/typenet";

Typenet.start();
```

**Client:**
```ts
import Typenet from "@rbxts/typenet";

Typenet.start();
```

Optionally configure debug and stats before starting:

```ts
Typenet.set({ debug: true, stats: true });
Typenet.start();
```

---

## Defining Packets

### Standalone

```ts
import { definePacket, t } from "@rbxts/typenet";

const Hello = definePacket("Hello", t.unknown);
const Ping  = definePacket("Ping"); // no data
```

### Channel (grouped packets)

```ts
import { Channel, Packet, t } from "@rbxts/typenet";

const Network = {
    Game: Channel("Game", {
        Hello: Packet(t.unknown),
        Ping:  Packet(),
    }),
};

export default Network;
```

---

## Sending

```ts
// Client → Server
Network.Game.Hello.send("world");

// Server → specific player
Network.Game.Hello.send("world", player);

// Server → all players
Network.Game.Hello.send("world");

// Server → all except one
Network.Game.Hello.send("world", ["Except", player]);

// No data
Network.Game.Ping.send();
```

---

## Receiving

```ts
// Listen
const connection = Network.Game.Hello.on((data, player) => {
    print(player?.Name, data);
});

// Listen once
Network.Game.Hello.once((data, player) => {
    print("First hello from", player?.Name);
});

// Disconnect
connection.Disconnect();
```

---

## Stats

`stats.on`, `stats.once`, and `stats.snapshot` are always available regardless of whether `stats: true` is set. Without it, callbacks still fire but `stats` will always be `undefined` — so you can wire up your stats listeners without extra guards, just nothing will be tracked in the background.

```ts
// Snapshot
const snap = Network.Game.Hello.stats.snapshot();
print(snap?.sentBytes.total);

// Listen with stats
Network.Game.Hello.stats.on((data, stats, player) => {
    print(`Received ${stats?.bytesReceived} bytes from ${player?.Name}`);
});
```

### Available fields

| Field | Description |
|---|---|
| `sentBytes.raw` | Payload bytes sent (no overhead) |
| `sentBytes.overhead` | Header bytes sent (packet id) |
| `sentBytes.total` | Total bytes sent |
| `bytesReceived` | Total bytes received |
| `totalFires` | Total times fired |
| `totalReceived` | Total times received |
| `averageBytes` | Average bytes per fire |
| `peakBytes` | Largest single send |
| `dropRate` | Ratio of dropped to total fires |
| `roundTripTime` | Last measured RTT in seconds |

---

## Architecture

```
serial/          -- reader, writer, codec primitives
channel/         -- inbound, outbound, wire
scheduler/       -- heartbeat flush, pending queue
definitions/     -- packet builder, channel builder, registry
debug/           -- stats, logger, config
```

---

## Luau Version

A native Luau version of Typenet is not planned. I have no knowledge of Luau types, especially with the new type solver, so I won't be attempting one myself. If someone wants to take that on, contributions are welcome.

---

## Acknowledgements

[Lync](https://github.com/Axp3cter/Lync/tree/main) by Axp3cter — the library that made me realize how good Roblox networking could actually look.
