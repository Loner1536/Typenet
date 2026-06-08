// Binary
import Cursor from "./binary/cursor";
import Writer from "./binary/writer";

export type { Writer, Cursor };

export namespace Codec {
    export type External<T> = {
		/** @hidden */ readonly _codec: T;
    };

    export type Internal<T> = Codec.External<T> & {
        write: (writer: Writer, value: T) => void;
        read: (cursor: Cursor) => T;

        _directWrite: (buff: buffer, offset: number, value: T) => void;
        _directRead: (buff: buffer, offset: number) => T;

        _default: T;

        _delta?: boolean;
        _size?: number;
    };

    export interface Vector2 extends Codec.External<globalThis.Vector2> {
        (x: Codec.External<number>, y: Codec.External<number>): Codec.External<globalThis.Vector2>;
    }
    export interface Vector3 extends Codec.External<globalThis.Vector3> {
        (x: Codec.External<number>, y: Codec.External<number>): Codec.External<globalThis.Vector3>;
    }

    export interface CFrame extends Codec.External<globalThis.CFrame> {
        (
            position: Codec.External<number>,
            rotation: Codec.External<number>,
        ): Codec.External<globalThis.CFrame>;
    }

    export interface UDim extends Codec.External<globalThis.UDim> {
        (offset: Codec.External<number>): Codec.External<globalThis.UDim>;
    }
    export interface UDim2 extends Codec.External<globalThis.UDim2> {
        (
            xOffset: Codec.External<number>,
            yOffset: Codec.External<number>,
        ): Codec.External<globalThis.UDim2>;
    }

    export interface NumberRange extends Codec.External<globalThis.NumberRange> {
        (
            min: Codec.External<number>,
            max: Codec.External<number>,
        ): Codec.External<globalThis.NumberRange>;
    }

    export interface Rect extends Codec.External<globalThis.Rect> {
        (
            min: Codec.External<globalThis.Vector2>,
            max: Codec.External<globalThis.Vector2>,
        ): Codec.External<globalThis.Rect>;
    }

    export interface Ray extends Codec.External<globalThis.Ray> {
        (
            min: Codec.External<globalThis.Vector3>,
            max: Codec.External<globalThis.Vector3>,
        ): Codec.External<globalThis.Ray>;
    }

    export interface String extends Codec.External<string> {
        (len: Codec.External<number>): Codec.External<string>;
    }

    export type Union<V extends Record<string, Codec.External<unknown>>> = {
        [K in keyof V]: { type: K } & Codec.Infer<V[K]>;
    }[keyof V];

    export type Infer<C extends Codec.External<unknown>> =
        C extends Codec.External<infer T> ? T : never;
    export type InferSchema<S extends Record<string, Codec.External<unknown>>> = {
        [K in keyof S]: Codec.Infer<S[K]>;
    };
}

export type Target = Player | Player[] | ["Exclude", Player | Player[]];

export namespace Packet {
    export type Options = {
        unreliable?: boolean;
        xor?: boolean;
    };

    export type Definition<T> = [T] extends [undefined]
        ? {
            send: (target?: Target) => void;
            on: (handler: (player: Player) => void) => void;
        }
        : {
            send: (data: T, target?: Target) => void;
            on: (handler: (player: Player, data: T) => void) => void;
        };
}

export type StartOptions = {
    debug?: boolean;
};

export type HeldBuffer = {
    player: Player;
    buf: buffer;
    unreliable: boolean;
};
export type FlushEntry = {
    id: number;

    start: number;
    end: number;
    target: Target | undefined;
    unreliable: boolean;

    codec: Codec.Internal<unknown>;
    data: unknown;

    xor: boolean;
};
