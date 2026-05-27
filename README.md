# Typenet

> A type-safe, batch-buffered networking library for Roblox, built with roblox-ts.

Heavily inspired by [Lync](https://github.com/Axp3cter/Lync/tree/main) — seeing how beautiful networking could be made me want to build something of my own. Blink and Zap never clicked for me, and while Tether was decent, I wanted something that felt truly clean. Lync showed me that was possible.

> **⚠️ Early Access** — Typenet is in very early development. The API is unstable and incomplete. Do not use in production.

---

## Features

- **Batch buffering** — packets are merged into a single buffer per heartbeat, minimizing remote event calls
- **Type-safe codecs** — fully typed encode/decode with a composable codec system
- **Channel grouping** — organize related packets and queries into named channels
- **Queries** — request/response pairs with correlation IDs, timeouts, and promise-based API
- **Per-packet stats** — track bytes sent, bytes received, drop rate, round trip time, and more
- **Reliable & unreliable** — choose per-packet whether to use reliable or unreliable transport

---

## Codecs

```ts
import { t } from "@rbxts/typenet";

t.unknown   // raw unknown value (JSON-encoded)
t.string    // utf-8 string (up to 255 characters)

t.u8        // unsigned 8-bit integer
t.u16       // unsigned 16-bit integer
t.u32       // unsigned 32-bit integer

t.i8        // signed 8-bit integer
t.i16       // signed 16-bit integer
t.i32       // signed 32-bit integer

t.f32       // 32-bit float
t.f64       // 64-bit float

t.num       // auto-detecting number — picks the smallest type at encode time
```

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

const Hello = definePacket("Hello", t.string);
const Ping  = definePacket("Ping"); // no data
```

### Channel (grouped packets and queries)

```ts
import { Channel, Packet, Query, t } from "@rbxts/typenet";

const Network = {
    Game: Channel("Game", {
        Hello:    Packet(t.string),
        Ping:     Packet(),
        Whisper:  Packet(t.string, { unreliable: true }),
        GetName:  Query(t.string),             // no request, string response
        SetScore: Query(t.u32, t.string),      // u32 request, string response
    }),
};

export default Network;
```

---

## Sending Packets

```ts
// Client → Server
Network.Game.Hello.send("world");

// Server → specific player
Network.Game.Hello.send("world", player);

// Server → all players
Network.Game.Hello.send("world");

// Server → all except one
Network.Game.Hello.send("world", ["Except", player]);

// Server → list of players
Network.Game.Hello.send("world", [player1, player2]);

// No data
Network.Game.Ping.send();
```

`send()` returns a `.stats()` chain that fires after the packet flushes:

```ts
// Auto-print to output
Network.Game.Hello.send("world").stats();

// Handle it yourself
Network.Game.Hello.send("world").stats((stats) => {
    print(`sent ${stats?.sentBytes.total} bytes`);
});
```

---

## Receiving Packets

`on()` and `once()` both return a chainable object with `.stats()` and `.Disconnect()`. The original listener fires immediately on receive; the `.stats()` callback fires a frame later once stats have been updated, so the numbers are always accurate by the time you read them.

```ts
// Listen
const connection = Network.Game.Hello.on((data, player) => {
    print(player?.Name, data);
});

connection.Disconnect();

// Listen with stats
Network.Game.Hello.on((data, player) => {
    print(player?.Name, data);
}).stats((data, stats, player) => {
    print(`received ${stats?.receivedBytes.total} bytes from ${player?.Name}`);
});

// Auto-print stats
Network.Game.Hello.on((data, player) => {
    print(data);
}).stats();

// Listen once
Network.Game.Hello.once((data, player) => {
    print("First hello from", player?.Name);
});

// Listen once with stats
Network.Game.Hello.once((data, player) => {
    print(data);
}).stats((data, stats, player) => {
    print(`first receive: ${stats?.receivedBytes.total} bytes`);
});
```

---

## Queries

Queries are request/response pairs. The client sends a request and receives a typed response via a promise. Requests are correlated automatically and time out after 10 seconds.

### No request data

```ts
// Server
Network.Game.GetName.response((player) => {
    return player?.Name ?? "Unknown";
});

// Client
Network.Game.GetName.request()
    .then((name) => print(`My name is ${name}`))
    .catch((err) => print(`Query failed: ${err}`));
```

### With request data

```ts
// Server
Network.Game.SetScore.response((score, player) => {
    return `${player?.Name} scored ${score}`;
});

// Client
Network.Game.SetScore.request(42)
    .then((result) => print(result))
    .catch((err) => print(`Query failed: ${err}`));
```

### Chaining stats before then

`.stats()` on a request returns the same `QueryRequest` so you can chain directly into `.then()`:

```ts
Network.Game.GetName.request()
    .stats((stats) => print(`request sent:`, stats))
    .then((name) => print(name))
    .catch((err) => print(err));
```

### Response stats

```ts
Network.Game.GetName.response((player) => {
    return player?.Name ?? "Unknown";
}).stats((stats) => {
    print(`responded:`, stats);
});
```

---

## Stats

Stats callbacks always fire regardless of whether `stats: true` is set — without it they still fire, but `stats` will always be `undefined`. This lets you wire up listeners freely without extra guards; nothing is tracked in the background until stats are enabled.

### Available fields

| Field | Description |
|---|---|
| `sentBytes.raw` | Payload bytes for the last send (no overhead) |
| `sentBytes.overhead` | Header bytes for the last send |
| `sentBytes.total` | Wire bytes for the last send |
| `sentBytes.totalRaw` | Cumulative raw bytes sent |
| `sentBytes.totalOverhead` | Cumulative overhead bytes sent |
| `sentBytes.totalWire` | Cumulative wire bytes sent |
| `totalFires` | Total times fired |
| `firstSentAt` | Timestamp of first send |
| `lastSentAt` | Timestamp of most recent send |
| `receivedBytes.raw` | Payload bytes for the last receive (no overhead) |
| `receivedBytes.overhead` | Header bytes for the last receive |
| `receivedBytes.total` | Wire bytes for the last receive |
| `receivedBytes.totalRaw` | Cumulative raw bytes received |
| `receivedBytes.totalOverhead` | Cumulative overhead bytes received |
| `receivedBytes.totalWire` | Cumulative wire bytes received |
| `totalReceived` | Total times received |
| `firstReceivedAt` | Timestamp of first receive |
| `lastReceivedAt` | Timestamp of most recent receive |
| `averageBytes` | Average wire bytes per send |
| `peakBytes` | Largest single send in bytes |
| `totalDropped` | Total dropped packets |
| `dropRate` | Ratio of dropped to total fires |
| `roundTripTime` | Last measured RTT in seconds |
| `lastRoundTripAt` | Timestamp of last RTT measurement |

---

## Architecture

```
serial/          -- reader, writer, codec primitives
channel/         -- inbound, outbound, wire
scheduler/       -- heartbeat flush, pending queue
definition/      -- packet builder, query builder, channel builder, registry
debug/           -- stats, logger, config
helper/          -- packet size estimation
```

---

## Luau Version

A native Luau version of Typenet is not planned. I have no knowledge of Luau types, especially with the new type solver, so I won't be attempting one myself. If someone wants to take that on, contributions are welcome.

---

## Acknowledgements

[Lync](https://github.com/Axp3cter/Lync/tree/main) by Axp3cter — the library that made me realize how good Roblox networking could actually look.
