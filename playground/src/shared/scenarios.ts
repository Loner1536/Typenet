////!optimize 2
//
//import Typenet, { t } from "@rbxts/typenet";
//import Lync from "@rbxts/lync";
//
//// ── Constants ─────────────────────────────────────────────────────────────────
//
//const POOL_SIZE = 1000;
//const ENT_COUNT = 100;
//const BOOL_COUNT = 1000;
//const CFRAME_COUNT = 50;
//
//// ── Types ─────────────────────────────────────────────────────────────────────
//
//export type Entity = {
//    id: number;
//    x: number;
//    y: number;
//    z: number;
//    orientation: number;
//    animation: number;
//};
//
//export type State = {
//    posX: number;
//    posY: number;
//    posZ: number;
//    velX: number;
//    velY: number;
//    velZ: number;
//    yaw: number;
//    pitch: number;
//    health: number;
//    armor: number;
//    alive: boolean;
//    grounded: boolean;
//};
//
//export type NetCase = {
//    label: string;
//    typenet: {
//        onRegister: () => void;
//        send: (d: defined, player?: Player) => void;
//        pool: defined[];
//    };
//    lync: {
//        onRegister: () => void;
//        send: (d: defined, player?: Player) => void;
//        pool: defined[];
//    };
//};
//
//// ── Schemas ───────────────────────────────────────────────────────────────────
//
//const entitySchema = {
//    id: t.int(0, 255),
//    x: t.int(0, 255),
//    y: t.int(0, 255),
//    z: t.int(0, 255),
//    orientation: t.int(0, 255),
//    animation: t.int(0, 255),
//};
//
//const stateSchema = {
//    posX: t.f32,
//    posY: t.f32,
//    posZ: t.f32,
//    velX: t.f32,
//    velY: t.f32,
//    velZ: t.f32,
//    yaw: t.f32,
//    pitch: t.f32,
//    health: t.int(0, 255),
//    armor: t.int(0, 255),
//    alive: t.boolean,
//    grounded: t.boolean,
//};
//
//const lyEntitySchema = {
//    id: Lync.int(0, 255),
//    x: Lync.int(0, 255),
//    y: Lync.int(0, 255),
//    z: Lync.int(0, 255),
//    orientation: Lync.int(0, 255),
//    animation: Lync.int(0, 255),
//};
//
//const lyStateSchema = {
//    posX: Lync.f32,
//    posY: Lync.f32,
//    posZ: Lync.f32,
//    velX: Lync.f32,
//    velY: Lync.f32,
//    velZ: Lync.f32,
//    yaw: Lync.f32,
//    pitch: Lync.f32,
//    health: Lync.int(0, 255),
//    armor: Lync.int(0, 255),
//    alive: Lync.bool,
//    grounded: Lync.bool,
//};
//
//// ── Codecs ────────────────────────────────────────────────────────────────────
//
//// Typenet
//const tnEntityCodec = t.struct(entitySchema);
//const tnEntityArray = t.array(tnEntityCodec);
//const tnEntityDeltaArray = t.deltaArray(tnEntityCodec);
//const tnBoolArray = t.array(t.boolean);
//const tnCFrameArray = t.array(t.cframe);
//const tnStateCodec = t.struct(stateSchema);
//const tnStateDelta = t.deltaStruct(stateSchema);
//const tnPositionMap = t.map(t.int(0, 1023), t.vector3);
//const tnPositionDeltaMap = t.deltaMap(t.int(0, 1023), t.vector3);
//const tnPositionsBaseline = t.vector3(-1000, 1000, 0.01);
//const tnPositionsCodec = t.deltaVector3(-1000, 1000, 0.01);
//const tnCFrameStreamBaseline = t.cframe;
//const tnCFrameStreamCodec = t.deltaCFrame(-1000, 1000, 0.01);
//const tnCounterBaseline = t.int(0, 1000000);
//const tnCounterCodec = t.deltaInt(0, 1000000);
//
//// Lync
//const lyEntityCodec = Lync.struct(lyEntitySchema);
//const lyEntityArray = Lync.array(lyEntityCodec);
//const lyEntityDeltaArray = Lync.deltaArray(lyEntityCodec);
//const lyBoolArray = Lync.array(Lync.bool);
//const lyCFrameArray = Lync.array(Lync.cframe());
//const lyStateCodec = Lync.struct(lyStateSchema);
//const lyStateDelta = Lync.deltaStruct(lyStateSchema);
//const lyPositionMap = Lync.map(Lync.int(0, 1023), Lync.vec3);
//const lyPositionDeltaMap = Lync.deltaMap(Lync.int(0, 1023), Lync.vec3);
//const lyPositionsBaseline = Lync.vec3(-1000, 1000, 0.01);
//const lyPositionsCodec = Lync.deltaVec3(-1000, 1000, 0.01);
//const lyCFrameStreamBaseline = Lync.cframe();
//const lyCFrameStreamCodec = Lync.deltaCFrame(-1000, 1000, 0.01);
//const lyCounterBaseline = Lync.int(0, 1000000);
//const lyCounterCodec = Lync.deltaInt(0, 1000000);
//
//// ── RNG (mirrors Lync: Random.new(0xB1A5)) ───────────────────────────────────
//
//const rng = new Random(0xb1a5);
//
//// ── Generators ────────────────────────────────────────────────────────────────
//
//function entity(): Entity {
//    return {
//        id: rng.NextInteger(0, 255),
//        x: rng.NextInteger(0, 255),
//        y: rng.NextInteger(0, 255),
//        z: rng.NextInteger(0, 255),
//        orientation: rng.NextInteger(0, 255),
//        animation: rng.NextInteger(0, 255),
//    };
//}
//
//function entityArr(n: number): Entity[] {
//    const a: Entity[] = [];
//    for (let i = 0; i < n; i++) a[i] = entity();
//    return a;
//}
//
//function boolArr(n: number): boolean[] {
//    const a: boolean[] = [];
//    for (let i = 0; i < n; i++) a[i] = rng.NextNumber() < 0.5;
//    return a;
//}
//
//function copyMap<K, V>(src: Map<K, V>): Map<K, V> {
//    const out = new Map<K, V>();
//    src.forEach((v, k) => out.set(k, v));
//    return out;
//}
//
//function cframeOne(): CFrame {
//    return new CFrame(
//        rng.NextNumber(-500, 500),
//        rng.NextNumber(0, 100),
//        rng.NextNumber(-500, 500),
//    ).mul(
//        CFrame.Angles(
//            rng.NextNumber(-math.pi, math.pi),
//            rng.NextNumber(-math.pi, math.pi),
//            rng.NextNumber(-math.pi, math.pi),
//        ),
//    );
//}
//
//function cframeArr(n: number): CFrame[] {
//    const a: CFrame[] = [];
//    for (let i = 0; i < n; i++) a[i] = cframeOne();
//    return a;
//}
//
//function stateOne(): State {
//    return {
//        posX: rng.NextNumber(-500, 500),
//        posY: rng.NextNumber(0, 100),
//        posZ: rng.NextNumber(-500, 500),
//        velX: rng.NextNumber(-50, 50),
//        velY: rng.NextNumber(-20, 20),
//        velZ: rng.NextNumber(-50, 50),
//        yaw: rng.NextNumber(-math.pi, math.pi),
//        pitch: rng.NextNumber(-1.4, 1.4),
//        health: rng.NextInteger(0, 255),
//        armor: rng.NextInteger(0, 255),
//        alive: rng.NextNumber() < 0.95,
//        grounded: rng.NextNumber() < 0.7,
//    };
//}
//
//// ── Pool builders ─────────────────────────────────────────────────────────────
//
//function poolVarying<T>(make: () => T): T[] {
//    const p: T[] = [];
//    for (let i = 0; i < POOL_SIZE; i++) p[i] = make();
//    return p;
//}
//
//function poolShared<T>(make: () => T): T[] {
//    const one = make();
//    const p: T[] = [];
//    for (let i = 0; i < POOL_SIZE; i++) p[i] = one;
//    return p;
//}
//
//// Mirrors Lync's poolBoolFlip exactly:
////   p[0]  = initial state  (Lua p[1])
////   p[i]  flips index  (i-1) % n  (Lua: 1 + (i-2) % n, same slot)
//function poolBoolFlip(n: number): boolean[][] {
//    const current = boolArr(n);
//    const p: boolean[][] = [];
//    p[0] = [...current];
//    for (let i = 1; i < POOL_SIZE; i++) {
//        const idx = (i - 1) % n; // 0-based equivalent of Lua's 1 + (i-2) % n
//        current[idx] = !current[idx];
//        p[i] = [...current];
//    }
//    return p;
//}
//
//function poolStateOneMut(): State[] {
//    const keys: (keyof State)[] = [
//        "posX",
//        "posY",
//        "posZ",
//        "velX",
//        "velY",
//        "velZ",
//        "yaw",
//        "pitch",
//        "health",
//        "armor",
//    ];
//    const current = stateOne();
//    const p: State[] = [];
//    p[0] = { ...current };
//    for (let i = 1; i < POOL_SIZE; i++) {
//        const k = keys[(i - 1) % keys.size()];
//        if (k === "health" || k === "armor") {
//            (current as unknown as Record<string, number>)[k] = rng.NextInteger(0, 255);
//        } else {
//            (current as unknown as Record<string, number>)[k] = rng.NextNumber(-100, 100);
//        }
//        p[i] = { ...current };
//    }
//    return p;
//}
//
//function poolEntityArrSparseMut(count: number): Entity[][] {
//    const current = entityArr(count);
//    const p: Entity[][] = [];
//    p[0] = current.map((e) => ({ ...e }));
//    for (let frame = 1; frame < POOL_SIZE; frame++) {
//        for (let k = 0; k < 3; k++) {
//            current[rng.NextInteger(0, count - 1)] = entity();
//        }
//        p[frame] = current.map((e) => ({ ...e }));
//    }
//    return p;
//}
//
//function poolPositionMap(): Map<number, Vector3>[] {
//    const current = new Map<number, Vector3>();
//    for (let i = 1; i <= 200; i++) {
//        current.set(i, new Vector3(rng.NextNumber(-100, 100), 0, rng.NextNumber(-100, 100)));
//    }
//    const p: Map<number, Vector3>[] = [];
//    p[0] = copyMap(current);
//    for (let frame = 1; frame < POOL_SIZE; frame++) {
//        for (let k = 0; k < 5; k++) {
//            const key = rng.NextInteger(1, 200);
//            current.set(key, new Vector3(rng.NextNumber(-100, 100), 0, rng.NextNumber(-100, 100)));
//        }
//        p[frame] = copyMap(current);
//    }
//    return p;
//}
//
//function poolPositionStream(): Vector3[] {
//    let current = new Vector3(0, 0, 0);
//    const p: Vector3[] = [];
//    for (let frame = 0; frame < POOL_SIZE; frame++) {
//        p[frame] = current;
//        current = current.add(
//            new Vector3(
//                rng.NextNumber(-0.5, 0.5),
//                rng.NextNumber(-0.5, 0.5),
//                rng.NextNumber(-0.5, 0.5),
//            ),
//        );
//    }
//    return p;
//}
//
//function poolCFrameStream(): CFrame[] {
//    let pos = new Vector3(0, 0, 0);
//    let yaw = 0;
//    const p: CFrame[] = [];
//    for (let frame = 0; frame < POOL_SIZE; frame++) {
//        p[frame] = new CFrame(pos).mul(CFrame.Angles(0, yaw, 0));
//        pos = pos.add(new Vector3(rng.NextNumber(-0.3, 0.3), 0, rng.NextNumber(-0.3, 0.3)));
//        yaw += rng.NextNumber(-0.05, 0.05);
//    }
//    return p;
//}
//
//function poolCounterStream(): number[] {
//    const p: number[] = [];
//    for (let i = 0; i < POOL_SIZE; i++) p[i] = i + 1; // 1..POOL_SIZE, mirrors Lua's 1-based loop
//    return p;
//}
//
//// ── Shared pools (same instance for paired delta/full cases) ─────────────────
//
//const sharedPositionMap = poolPositionMap();
//const sharedPositionStream = poolPositionStream();
//const sharedCFrameStream = poolCFrameStream();
//const sharedCounterStream = poolCounterStream();
//
//// ── Blink pools ───────────────────────────────────────────────────────────────
//// Mirrors Lync exactly: math.randomseed(0), entity array via math.random(1,255),
//// bool array is table.create(1000, true) — all true, NOT random.
//
//math.randomseed(0);
//const blinkEntityArr: Entity[] = [];
//for (let i = 0; i < ENT_COUNT; i++) {
//    blinkEntityArr[i] = {
//        id: math.random(1, 255),
//        x: math.random(1, 255),
//        y: math.random(1, 255),
//        z: math.random(1, 255),
//        orientation: math.random(1, 255),
//        animation: math.random(1, 255),
//    };
//}
//
//// All true — matches Lync's table.create(BOOL_COUNT, true)
//const blinkBoolArr: boolean[] = [];
//for (let i = 0; i < BOOL_COUNT; i++) blinkBoolArr[i] = true;
//
//const blinkEntityPool = poolShared(() => blinkEntityArr);
//const blinkBoolPool = poolShared(() => blinkBoolArr);
//
//// ── Packet factories ──────────────────────────────────────────────────────────
//// nextId is shared and incremented in the same order as Lync's defCase calls
//// so packet names stay in sync across both files.
//
//let nextId = 0;
//
//function defTN<T>(codec: Typenet.Codec<T>) {
//    nextId++;
//    return Typenet.definePacket(`Bench_${nextId}`, codec);
//}
//
//function defLY<T>(codec: Lync.Codec<T>) {
//    // nextId already incremented by defTN above — Lync packets share the counter
//    return Lync.packet(`Bench_${nextId}`, codec);
//}
//
//function defCase<T>(
//    label: string,
//    tnCodec: Typenet.Codec<T>,
//    lyCodec: Lync.Codec<T>,
//    pool: T[],
//): NetCase {
//    const tn = defTN(tnCodec);
//    const ly = defLY(lyCodec);
//    const castPool = pool as defined[];
//    return {
//        label,
//        typenet: {
//            onRegister: () => tn.on(() => { }),
//            send: (d, p) => tn.send(d as never, p),
//            pool: castPool,
//        },
//        lync: {
//            onRegister: () => ly.on(() => { }),
//            send: (d, p) => ly.send(d as never, p),
//            pool: castPool,
//        },
//    };
//}
//
//// ── Cases ─────────────────────────────────────────────────────────────────────
//
//export const blinkCases: NetCase[] = [
//    defCase("blink_entity_arr_100", tnEntityArray, lyEntityArray, blinkEntityPool),
//    defCase("blink_bool_arr_1000", tnBoolArray, lyBoolArray, blinkBoolPool),
//];
//
//export const extendedCases: NetCase[] = [
//    defCase(
//        "entity_arr_100__vary",
//        tnEntityArray,
//        lyEntityArray,
//        poolVarying(() => entityArr(ENT_COUNT)),
//    ),
//    defCase(
//        "entity_arr_100__stable",
//        tnEntityArray,
//        lyEntityArray,
//        poolShared(() => entityArr(ENT_COUNT)),
//    ),
//    defCase(
//        "entity_arr_400__vary",
//        tnEntityArray,
//        lyEntityArray,
//        poolVarying(() => entityArr(400)),
//    ),
//    defCase(
//        "entity_deltaArr_400__3mut",
//        tnEntityDeltaArray,
//        lyEntityDeltaArray,
//        poolEntityArrSparseMut(400),
//    ),
//    defCase(
//        "entity_deltaArr_400__stable",
//        tnEntityDeltaArray,
//        lyEntityDeltaArray,
//        poolShared(() => entityArr(400)),
//    ),
//    defCase(
//        "entity_deltaArr_100__3mut",
//        tnEntityDeltaArray,
//        lyEntityDeltaArray,
//        poolEntityArrSparseMut(ENT_COUNT),
//    ),
//    defCase(
//        "entity_deltaArr_100__stable",
//        tnEntityDeltaArray,
//        lyEntityDeltaArray,
//        poolShared(() => entityArr(ENT_COUNT)),
//    ),
//    defCase(
//        "bool_arr_1000__vary",
//        tnBoolArray,
//        lyBoolArray,
//        poolVarying(() => boolArr(BOOL_COUNT)),
//    ),
//    defCase("bool_arr_1000__1flip", tnBoolArray, lyBoolArray, poolBoolFlip(BOOL_COUNT)),
//    defCase(
//        "cframe_arr_50__vary",
//        tnCFrameArray,
//        lyCFrameArray,
//        poolVarying(() => cframeArr(CFRAME_COUNT)),
//    ),
//    defCase("state_full__vary", tnStateCodec, lyStateCodec, poolVarying(stateOne)),
//    defCase("state_delta__1mut", tnStateDelta, lyStateDelta, poolStateOneMut()),
//    defCase("position_map_200__5mut", tnPositionMap, lyPositionMap, sharedPositionMap),
//    defCase(
//        "position_deltaMap_200__5mut",
//        tnPositionDeltaMap,
//        lyPositionDeltaMap,
//        sharedPositionMap,
//    ),
//    defCase(
//        "position_deltaMap_200__stable",
//        tnPositionDeltaMap,
//        lyPositionDeltaMap,
//        poolShared(() => {
//            const m = new Map<number, Vector3>();
//            for (let i = 1; i <= 200; i++) {
//                m.set(i, new Vector3(rng.NextNumber(-100, 100), 0, rng.NextNumber(-100, 100)));
//            }
//            return m;
//        }),
//    ),
//    defCase("vec3_walking__full", tnPositionsBaseline, lyPositionsBaseline, sharedPositionStream),
//    defCase("vec3_walking__delta", tnPositionsCodec, lyPositionsCodec, sharedPositionStream),
//    defCase(
//        "cframe_walking__full",
//        tnCFrameStreamBaseline,
//        lyCFrameStreamBaseline,
//        sharedCFrameStream,
//    ),
//    defCase("cframe_walking__delta", tnCFrameStreamCodec, lyCFrameStreamCodec, sharedCFrameStream),
//    defCase("counter_int__full", tnCounterBaseline, lyCounterBaseline, sharedCounterStream),
//    defCase("counter_int__delta", tnCounterCodec, lyCounterCodec, sharedCounterStream),
//];
//
//// ── Handshake ─────────────────────────────────────────────────────────────────
//
//export const handshake = {
//    ServerCpuDone: Typenet.definePacket("BenchServerCpuDone", t.boolean),
//    ClientReady: Typenet.definePacket("BenchClientReady", t.boolean),
//    ServerSwap: Typenet.definePacket("BenchServerSwap", t.boolean),
//    ClientDone: Typenet.definePacket("BenchClientDone", t.boolean),
//};
//
//// ── Config ────────────────────────────────────────────────────────────────────
//
//export const bench = {
//    blinkFiresPerFrame: 1000,
//    blinkSeconds: 10,
//    extendedFiresPerFrame: 100,
//    extendedSeconds: 8,
//};
