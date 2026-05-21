export type ReceivedMap = Record<string, Record<string, number>>;

export const MAX_FPF = 100;
export const POOL_SIZE = 1000;

math.randomseed(0);

function randomBool(): boolean {
	return math.random() > 0.5;
}

function randomByte(): number {
	return math.random(0, 255);
}

function randomStr(maxLen: number): string {
	const len = math.random(1, maxLen);
	let s = "";
	for (let i = 0; i < len; i++) {
		s += string.char(math.random(65, 90));
	}
	return s;
}

export type Entity = {
	id: number;
	x: number;
	y: number;
	z: number;
	orientation: number;
	animation: number;
};

export const boolArrayPool: boolean[][] = [];
for (let i = 0; i < POOL_SIZE; i++) {
	const arr: boolean[] = [];
	for (let j = 0; j < MAX_FPF; j++) arr.push(randomBool());
	boolArrayPool.push(arr);
}

export const boolPool: boolean[] = [];
for (let i = 0; i < POOL_SIZE; i++) boolPool.push(randomBool());

export const entityPool: Entity[][] = [];
for (let i = 0; i < POOL_SIZE; i++) {
	const arr: Entity[] = [];
	for (let j = 0; j < MAX_FPF; j++) {
		arr.push({
			id: randomByte(),
			x: randomByte(),
			y: randomByte(),
			z: randomByte(),
			orientation: randomByte(),
			animation: randomByte(),
		});
	}
	entityPool.push(arr);
}

export const stringPool: string[] = [];
for (let i = 0; i < POOL_SIZE; i++) stringPool.push(randomStr(32));
