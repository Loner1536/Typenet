# Typenet

> A type-safe, batch-buffered networking library for Roblox, built with roblox-ts.

Heavily inspired by [Lync](https://github.com/Axp3cter/Lync/tree/main) — seeing how beautiful networking could be made me want to build something of my own.

> **⚠️ Early Access** — Typenet is in very early development. The API is unstable and incomplete. Do not use in production.

---

## Installation

```bash
npm install @rbxts/typenet
```

---

## Setup

Call `start()` on both the server and client before sending or receiving anything.

```ts
import Typenet from "@rbxts/typenet";

Typenet.start();
```

Pass options to enable debug logging:

```ts
Typenet.start({ debug: true });
```

---

## Defining Packets

```ts
import Typenet, { t } from "@rbxts/typenet";

const Hello   = Typenet.definePacket("Hello", t.string);
const Ping    = Typenet.definePacket("Ping");                              // no data
const Whisper = Typenet.definePacket("Whisper", t.string, { unreliable: true });
```

---

## Sending

```ts
// Client → Server
Hello.send("world");

// Server → specific player
Hello.send("world", player);

// Server → all players
Hello.send("world");

// Server → all except one
Hello.send("world", ["Exclude", player]);

// Server → list of players
Hello.send("world", [player1, player2]);

// No data
Ping.send();
```

---

## Receiving

```ts
Hello.on((player, data) => {
    print(player.Name, data);
});
```

---

## Codecs

All codecs are available on the `t` export.

### Primitives

```ts
t.u8   t.u16   t.u32
t.i8   t.i16   t.i32
t.f16  t.f32   t.f64
t.u24

t.boolean
t.string            // length-prefixed (u32), or t.string(t.u8) for custom length prefix
t.zint              // varint with zigzag encoding for signed integers
t.int(min, max)     // range-bounded integer — picks the smallest wire type automatically
t.float(min, max)   // f16 by default; t.float(min, max, precision) for quantized floats
t.literal("a", "b", "c")  // enum-like, stored as u8 index
t.unknown           // JSON-encoded fallback — avoid in hot paths
```

### Composites

```ts
t.struct({ x: t.f32, y: t.f32, alive: t.boolean })
t.array(t.f32)
t.tuple([t.u8, t.string, t.boolean])
t.optional(t.f32)
t.map(t.string, t.u32)
t.set(t.u8)
t.union({ move: t.struct({ ... }), fire: t.struct({ ... }) })
```

### Delta codecs

Delta codecs skip unchanged fields — only dirty state is written to the wire.

```ts
t.deltaStruct({ x: t.f32, y: t.f32, hp: t.u8 })
t.deltaArray(t.f32)
```

### Roblox types

```ts
t.vector2                       // f32 components; t.vector2(t.f16, t.f16) for custom precision
t.vector3                       // f32 components; t.vector3(t.f16, t.f16, t.f16) for custom
t.cframe                        // quaternion-compressed; t.cframe(posCodec, rotCodec)
t.color3
t.udim                          // t.udim(offsetCodec)
t.udim2                         // t.udim2(xOffsetCodec, yOffsetCodec)
t.numberRange                   // t.numberRange(minCodec, maxCodec)
t.rect
t.ray
t.brickColor
t.buffer
t.enum(Enum.HumanoidStateType)
```

---

## Benchmarks

Compared against [Lync](https://github.com/Axp3cter/Lync/tree/main). Each test ran for ~35–50 seconds. FPS reflects server/client tick rate under load; Kbps P50/P95 are median and 95th-percentile throughput.

### Server → Client · 1000 fires/frame

| Test                  | Tool    | FPS | Kbps P50 | Kbps P95 |
|-----------------------|---------|-----|----------|----------|
| blink_entity_arr_100  | typenet | 20  | 14.41    | 33.97    |
|                       | lync    | 19  | 1.31     | 1.37     |
| blink_bool_arr_1000   | typenet | 49  | 2.36     | 2.53     |
|                       | lync    | 61  | 2.41     | 2.44     |

### Server → Client · 100 fires/frame (extended)

| Test                      | Tool    | FPS | Kbps P50  | Kbps P95  |
|---------------------------|---------|-----|-----------|-----------|
| entity_arr_100__vary      | typenet | 61  | 3615.58   | 3636.75   |
|                           | lync    | 61  | 3609.93   | 3621.50   |
| entity_arr_100__stable    | typenet | 60  | 38.70     | 38.82     |
|                           | lync    | 61  | 2.36      | 7.96      |
| entity_arr_400__vary      | typenet | 48  | 11188.15  | 11696.12  |
|                           | lync    | 49  | 11042.32  | 11943.25  |
| entity_deltaArr_400__3mut | typenet | 61  | 178.79    | 182.30    |
|                           | lync    | 60  | 183.57    | 184.63    |
| entity_deltaArr_400__stable | typenet | 60 | 2.28    | 2.31     |
|                           | lync    | 61  | 2.30      | 2.36      |
| entity_deltaArr_100__3mut | typenet | 61  | 153.24    | 154.40    |
|                           | lync    | 60  | 154.23    | 154.25    |
| entity_deltaArr_100__stable | typenet | 60 | 2.35   | 2.42      |
|                           | lync    | 61  | 2.34      | 2.40      |
| bool_arr_1000__vary       | typenet | 60  | 775.16    | 776.84    |
|                           | lync    | 61  | 763.88    | 767.31    |
| bool_arr_1000__1flip      | typenet | 61  | 21.78     | 21.86     |
|                           | lync    | 60  | 20.24     | 20.34     |

### Client → Server · 1000 fires/frame

| Test                  | Tool    | FPS | Kbps P50 | Kbps P95 |
|-----------------------|---------|-----|----------|----------|
| blink_entity_arr_100  | typenet | 22  | 14.73    | 15.75    |
|                       | lync    | 13  | 0.98     | 1.01     |
| blink_bool_arr_1000   | typenet | 51  | 2.57     | 2.81     |
|                       | lync    | 38  | 1.78     | 2.06     |

### Client → Server · 100 fires/frame (extended)

| Test                      | Tool    | FPS | Kbps P50  | Kbps P95  |
|---------------------------|---------|-----|-----------|-----------|
| entity_arr_100__vary      | typenet | 60  | 3618.74   | 3621.11   |
|                           | lync    | 61  | 3604.63   | 3611.68   |
| entity_arr_100__stable    | typenet | 61  | 38.68     | 38.83     |
|                           | lync    | 61  | 2.42      | 7.69      |
| entity_arr_400__vary      | typenet | 51  | 12262.02  | 12519.97  |
|                           | lync    | 32  | 7528.89   | 7780.65   |
| entity_deltaArr_400__3mut | typenet | 61  | 181.61    | 184.01    |
|                           | lync    | 60  | 182.49    | 183.68    |
| entity_deltaArr_400__stable | typenet | 61 | 2.42   | 2.44      |
|                           | lync    | 60  | 2.01      | 2.33      |
| entity_deltaArr_100__3mut | typenet | 61  | 153.91    | 154.12    |
|                           | lync    | 60  | 153.72    | 154.33    |
| entity_deltaArr_100__stable | typenet | 60 | 2.46  | 2.54      |
|                           | lync    | 61  | 2.03      | 2.24      |
| bool_arr_1000__vary       | typenet | 61  | 774.85    | 776.06    |
|                           | lync    | 61  | 764.04    | 765.61    |
| bool_arr_1000__1flip      | typenet | 60  | 21.84     | 21.98     |
|                           | lync    | 61  | 20.29     | 20.39     |

> **Note on `blink_*` tests:** these simulate 1000 fires per frame — an extreme stress test. The higher Kbps on typenet here reflects the cost of XOR deduplication overhead under that load, not extra data being sent. At realistic fire rates the gap disappears.

---

## Architecture

```
api/          -- definePacket
binary/       -- cursor, writer
codec/        -- primitives, composites, delta, roblox types
transport/    -- bridge, outbound, inbound, registry, lifecycle, handshake, snapshot, engine
security/     -- report (logging, kicks, fatals)
utility/      -- bool-pack, resolve-target
```

---

## Acknowledgements

[Lync](https://github.com/Axp3cter/Lync/tree/main) by Axp3cter — the library that made me realize how good Roblox networking could actually look.
