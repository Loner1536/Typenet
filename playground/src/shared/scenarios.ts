//!optimize 2

// Package
import Typenet, { t } from "@rbxts/typenet";
import Lync from "@rbxts/lync";

const POOL_SIZE = 1000;
const ENT_COUNT = 100;
const BOOL_COUNT = 1000;

function copyArr<T>(arr: T[]): T[] {
    const copy: T[] = [];
    const len = arr.size();
    for (let i = 0; i < len; i++) copy[i] = arr[i];
    return copy;
}

function copyEntity(e: Entity): Entity {
    return {
        id: e.id,
        x: e.x,
        y: e.y,
        z: e.z,
        orientation: e.orientation,
        animation: e.animation,
    };
}

// ── Codecs ───────────────────────────────────────────────────────────────

const tnEntityCodec = t.struct({
    id: t.int(0, 255),
    x: t.int(0, 255),
    y: t.int(0, 255),
    z: t.int(0, 255),
    orientation: t.int(0, 255),
    animation: t.int(0, 255),
});
const tnEntityArray = t.array(tnEntityCodec);
const tnEntityDeltaArray = t.deltaArray(tnEntityCodec);
const tnBoolArray = t.array(t.boolean);

const lyEntityCodec = Lync.struct({
    id: Lync.int(0, 255),
    x: Lync.int(0, 255),
    y: Lync.int(0, 255),
    z: Lync.int(0, 255),
    orientation: Lync.int(0, 255),
    animation: Lync.int(0, 255),
});
const lyEntityArray = Lync.array(lyEntityCodec, 1000);
const lyEntityDeltaArray = Lync.deltaArray(lyEntityCodec, 1000);
const lyBoolArray = Lync.array(Lync.bool, 1000);

// ── Types ────────────────────────────────────────────────────────────────

export type Entity = {
    id: number;
    x: number;
    y: number;
    z: number;
    orientation: number;
    animation: number;
};

export type NetCase = {
    label: string;
    typenet: {
        onRegister: () => void;
        send: (d: defined[], player?: Player) => void;
        pool: defined[][];
    };
    lync: {
        onRegister: () => void;
        send: (d: defined[], player?: Player) => void;
        pool: defined[][];
    };
};

// ── Generators ───────────────────────────────────────────────────────────

const rng = new Random(0xb1a5);

function entity(): Entity {
    return {
        id: rng.NextInteger(0, 255),
        x: rng.NextInteger(0, 255),
        y: rng.NextInteger(0, 255),
        z: rng.NextInteger(0, 255),
        orientation: rng.NextInteger(0, 255),
        animation: rng.NextInteger(0, 255),
    };
}

function entityArr(n: number): Entity[] {
    const a: Entity[] = [];
    for (let i = 0; i < n; i++) a[i] = entity();
    return a;
}

function boolArr(n: number): boolean[] {
    const a: boolean[] = [];
    for (let i = 0; i < n; i++) a[i] = rng.NextNumber() < 0.5;
    return a;
}

// ── Pool builders ────────────────────────────────────────────────────────

function poolVarying<T>(make: () => T): T[] {
    const p: T[] = [];
    for (let i = 0; i < POOL_SIZE; i++) p[i] = make();
    return p;
}

function poolShared<T>(make: () => T): T[] {
    const one = make();
    const p: T[] = [];
    for (let i = 0; i < POOL_SIZE; i++) p[i] = one;
    return p;
}

function poolBoolFlip(n: number): boolean[][] {
    const current = boolArr(n);
    const p: boolean[][] = [];
    p[0] = copyArr(current);
    for (let i = 1; i < POOL_SIZE; i++) {
        current[i % n] = !current[i % n];
        p[i] = copyArr(current);
    }
    return p;
}

function poolEntityArrSparseMut(count: number): Entity[][] {
    const current = entityArr(count);
    const p: Entity[][] = [];
    p[0] = current.map((e) => copyEntity(e));
    for (let frame = 1; frame < POOL_SIZE; frame++) {
        for (let k = 0; k < 3; k++) {
            current[rng.NextInteger(0, count - 1)] = entity();
        }
        p[frame] = current.map((e) => copyEntity(e));
    }
    return p;
}

// ── Packet factories ─────────────────────────────────────────────────────

let nextId = 0;

function defTN<T>(codec: Typenet.Codec<T>) {
    nextId++;
    return Typenet.definePacket(`TN_Bench_${nextId}`, codec, { xor: false });
}

function defLY<T>(codec: Lync.Codec<T>) {
    nextId++;
    return Lync.packet(`LY_Bench_${nextId}`, codec);
}

// ── Blink pools ───────────────────────────────────────────────────────────

math.randomseed(0);
const blinkEntityArr: Entity[] = [];
for (let i = 0; i < ENT_COUNT; i++) {
    blinkEntityArr[i] = {
        id: math.random(1, 255),
        x: math.random(1, 255),
        y: math.random(1, 255),
        z: math.random(1, 255),
        orientation: math.random(1, 255),
        animation: math.random(1, 255),
    };
}
const blinkBoolArr: boolean[] = [];
for (let i = 0; i < BOOL_COUNT; i++) blinkBoolArr[i] = true;

// ── Cases ─────────────────────────────────────────────────────────────────

// Blink entity
const tnBlinkEntity = defTN(tnEntityArray);
const lyBlinkEntity = defLY(lyEntityArray);

// Blink bool
const tnBlinkBool = defTN(tnBoolArray);
const lyBlinkBool = defLY(lyBoolArray);

// Extended entity vary
const tnEntVary = defTN(tnEntityArray);
const lyEntVary = defLY(lyEntityArray);

// Extended entity stable
const tnEntStable = defTN(tnEntityArray);
const lyEntStable = defLY(lyEntityArray);

// Extended entity 400 vary
const tnEnt400Vary = defTN(tnEntityArray);
const lyEnt400Vary = defLY(lyEntityArray);

// Extended delta 400 3mut
const tnDelta400Mut = defTN(tnEntityDeltaArray);
const lyDelta400Mut = defLY(lyEntityDeltaArray);

// Extended delta 400 stable
const tnDelta400Stable = defTN(tnEntityDeltaArray);
const lyDelta400Stable = defLY(lyEntityDeltaArray);

// Extended delta 100 3mut
const tnDelta100Mut = defTN(tnEntityDeltaArray);
const lyDelta100Mut = defLY(lyEntityDeltaArray);

// Extended delta 100 stable
const tnDelta100Stable = defTN(tnEntityDeltaArray);
const lyDelta100Stable = defLY(lyEntityDeltaArray);

// Extended bool vary
const tnBoolVary = defTN(tnBoolArray);
const lyBoolVary = defLY(lyBoolArray);

// Extended bool 1flip
const tnBoolFlip = defTN(tnBoolArray);
const lyBoolFlip = defLY(lyBoolArray);

// ── Pools ─────────────────────────────────────────────────────────────────

const blinkEntityPool = poolShared(() => blinkEntityArr) as defined[][];
const blinkBoolPool = poolShared(() => blinkBoolArr) as defined[][];
const entVaryPool = poolVarying(() => entityArr(ENT_COUNT)) as defined[][];
const entStablePool = poolShared(() => entityArr(ENT_COUNT)) as defined[][];
const ent400VaryPool = poolVarying(() => entityArr(400)) as defined[][];
const ent400MutPool = poolEntityArrSparseMut(400) as defined[][];
const ent400StablePool = poolShared(() => entityArr(400)) as defined[][];
const ent100MutPool = poolEntityArrSparseMut(ENT_COUNT) as defined[][];
const ent100StablePool = poolShared(() => entityArr(ENT_COUNT)) as defined[][];
const boolVaryPool = poolVarying(() => boolArr(BOOL_COUNT)) as defined[][];
const boolFlipPool = poolBoolFlip(BOOL_COUNT) as defined[][];

// ── Exports ───────────────────────────────────────────────────────────────

export const blinkCases: NetCase[] = [
    {
        label: "blink_entity_arr_100",
        typenet: {
            onRegister: () => tnBlinkEntity.on(() => { }),
            send: (d, p) => tnBlinkEntity.send(d as never, p),
            pool: blinkEntityPool,
        },
        lync: {
            onRegister: () => lyBlinkEntity.on(() => { }),
            send: (d, p) => lyBlinkEntity.send(d as never, p),
            pool: blinkEntityPool,
        },
    },
    {
        label: "blink_bool_arr_1000",
        typenet: {
            onRegister: () => tnBlinkBool.on(() => { }),
            send: (d, p) => tnBlinkBool.send(d as never, p),
            pool: blinkBoolPool,
        },
        lync: {
            onRegister: () => lyBlinkBool.on(() => { }),
            send: (d, p) => lyBlinkBool.send(d as never, p),
            pool: blinkBoolPool,
        },
    },
];

export const extendedCases: NetCase[] = [
    {
        label: "entity_arr_100__vary",
        typenet: {
            onRegister: () => tnEntVary.on(() => { }),
            send: (d, p) => tnEntVary.send(d as never, p),
            pool: entVaryPool,
        },
        lync: {
            onRegister: () => lyEntVary.on(() => { }),
            send: (d, p) => lyEntVary.send(d as never, p),
            pool: entVaryPool,
        },
    },
    {
        label: "entity_arr_100__stable",
        typenet: {
            onRegister: () => tnEntStable.on(() => { }),
            send: (d, p) => tnEntStable.send(d as never, p),
            pool: entStablePool,
        },
        lync: {
            onRegister: () => lyEntStable.on(() => { }),
            send: (d, p) => lyEntStable.send(d as never, p),
            pool: entStablePool,
        },
    },
    {
        label: "entity_arr_400__vary",
        typenet: {
            onRegister: () => tnEnt400Vary.on(() => { }),
            send: (d, p) => tnEnt400Vary.send(d as never, p),
            pool: ent400VaryPool,
        },
        lync: {
            onRegister: () => lyEnt400Vary.on(() => { }),
            send: (d, p) => lyEnt400Vary.send(d as never, p),
            pool: ent400VaryPool,
        },
    },
    {
        label: "entity_deltaArr_400__3mut",
        typenet: {
            onRegister: () => tnDelta400Mut.on(() => { }),
            send: (d, p) => tnDelta400Mut.send(d as never, p),
            pool: ent400MutPool,
        },
        lync: {
            onRegister: () => lyDelta400Mut.on(() => { }),
            send: (d, p) => lyDelta400Mut.send(d as never, p),
            pool: ent400MutPool,
        },
    },
    {
        label: "entity_deltaArr_400__stable",
        typenet: {
            onRegister: () => tnDelta400Stable.on(() => { }),
            send: (d, p) => tnDelta400Stable.send(d as never, p),
            pool: ent400StablePool,
        },
        lync: {
            onRegister: () => lyDelta400Stable.on(() => { }),
            send: (d, p) => lyDelta400Stable.send(d as never, p),
            pool: ent400StablePool,
        },
    },
    {
        label: "entity_deltaArr_100__3mut",
        typenet: {
            onRegister: () => tnDelta100Mut.on(() => { }),
            send: (d, p) => tnDelta100Mut.send(d as never, p),
            pool: ent100MutPool,
        },
        lync: {
            onRegister: () => lyDelta100Mut.on(() => { }),
            send: (d, p) => lyDelta100Mut.send(d as never, p),
            pool: ent100MutPool,
        },
    },
    {
        label: "entity_deltaArr_100__stable",
        typenet: {
            onRegister: () => tnDelta100Stable.on(() => { }),
            send: (d, p) => tnDelta100Stable.send(d as never, p),
            pool: ent100StablePool,
        },
        lync: {
            onRegister: () => lyDelta100Stable.on(() => { }),
            send: (d, p) => lyDelta100Stable.send(d as never, p),
            pool: ent100StablePool,
        },
    },
    {
        label: "bool_arr_1000__vary",
        typenet: {
            onRegister: () => tnBoolVary.on(() => { }),
            send: (d, p) => tnBoolVary.send(d as never, p),
            pool: boolVaryPool,
        },
        lync: {
            onRegister: () => lyBoolVary.on(() => { }),
            send: (d, p) => lyBoolVary.send(d as never, p),
            pool: boolVaryPool,
        },
    },
    {
        label: "bool_arr_1000__1flip",
        typenet: {
            onRegister: () => tnBoolFlip.on(() => { }),
            send: (d, p) => tnBoolFlip.send(d as never, p),
            pool: boolFlipPool,
        },
        lync: {
            onRegister: () => lyBoolFlip.on(() => { }),
            send: (d, p) => lyBoolFlip.send(d as never, p),
            pool: boolFlipPool,
        },
    },
];

export const handshake = {
    ServerCpuDone: Typenet.definePacket("BenchServerCpuDone", t.boolean),
    ClientReady: Typenet.definePacket("BenchClientReady", t.boolean),
    ServerSwap: Typenet.definePacket("BenchServerSwap", t.boolean),
    ClientDone: Typenet.definePacket("BenchClientDone", t.boolean),
};

export const bench = {
    blinkFiresPerFrame: 1000,
    blinkSeconds: 10,
    extendedFiresPerFrame: 100,
    extendedSeconds: 8,
};
