// Types
import * as Types from "../types";

// Channel
import { send as sendPacket } from "../channel/outbound";
import { createListener } from "../channel/inbound";

// Definition
import { register } from "../definition/registry";

// Debug
import Stats, { getStats } from "../debug/stats";
import { isStats } from "../debug/config";
import Logger from "../debug/logger";

const FROM = "Query";
const TIMEOUT = 10;

let corrCounter = 0;
function nextCorrId(): number {
    corrCounter = (corrCounter + 1) & 0xffff;
    return corrCounter;
}

export function defineQuery<Res>(
    name: string,
    responseCodec: Types.Codec<Res>,
): Types.Query<undefined, Res>;
export function defineQuery<Req, Res>(
    name: string,
    requestCodec: Types.Codec<Req>,
    responseCodec: Types.Codec<Res>,
): Types.Query<Req, Res>;

export function defineQuery<Req, Res>(
    name: string,
    requestCodecOrResponseCodec: Types.Codec<any>,
    responseCodec?: Types.Codec<any>,
): Types.Query<any, any> {
    const requestId = register(`${name}/request`);
    const responseId = register(`${name}/response`);

    if (isStats()) {
        new Stats(`${name}/request`);
        new Stats(`${name}/response`);
    }

    let reqCodec: Types.InternalCodec<Req> | undefined;
    let resCodec: Types.InternalCodec<Res>;

    if (responseCodec !== undefined) {
        reqCodec = requestCodecOrResponseCodec as Types.InternalCodec<Req>;
        resCodec = responseCodec as Types.InternalCodec<Res>;
    } else {
        resCodec = requestCodecOrResponseCodec as Types.InternalCodec<Res>;
    }

    Logger.print(FROM, `Registered query "${name}" [req: ${requestId}, res: ${responseId}]`);

    const pending = new Map<
        number,
        { resolve: (value: Res) => void; reject: (err: string) => void }
    >();

    createListener(
        responseId,
        `${name}/response`,
        {
            _nominal_codec: undefined as never,
            encode: (writer, value) => {
                writer.u16((value as { corrId: number; value: Res }).corrId);
                resCodec.encode(writer, (value as { corrId: number; value: Res }).value);
            },
            decode: (reader) => {
                const corrId = reader.u16();
                const value = resCodec.decode(reader);
                return { corrId, value };
            },
        } as Types.InternalCodec<{ corrId: number; value: Res }>,
        (data, _player) => {
            const { corrId, value } = data as { corrId: number; value: Res };
            const entry = pending.get(corrId);
            if (entry) {
                pending.delete(corrId);
                entry.resolve(value);
            }
        },
    );

    const request = (
        dataOrTarget?: Req | Types.SendTarget,
        target?: Types.SendTarget,
    ): Types.QueryRequest<Res> => {
        const corrId = nextCorrId();

        const codec: Types.InternalCodec<Req | undefined> = {
            _nominal_codec: undefined as never,
            encode: (writer, value) => {
                writer.u16(corrId);
                if (reqCodec) reqCodec.encode(writer, value as Req);
            },
            decode: (reader) => {
                reader.u16();
                return reqCodec ? reqCodec.decode(reader) : undefined;
            },
        };

        sendPacket(requestId, `${name}/request`, codec, false, dataOrTarget, target);

        const promise = new Promise<Res>((resolve, reject) => {
            const timer = task.delay(TIMEOUT, () => {
                if (pending.delete(corrId)) {
                    reject(`[TYPENET] Query "${name}" timed out after ${TIMEOUT}s`);
                }
            });
            pending.set(corrId, {
                resolve: (value) => {
                    task.cancel(timer);
                    resolve(value);
                },
                reject,
            });
        });

        const req = promise as Types.QueryRequest<Res>;

        (req as unknown as { stats: unknown }).stats = (
            fn?: (stats: Types.PacketStats | undefined) => void,
        ) => {
            const snap = getStats(`${name}/request`)?.snapshot();
            if (fn) {
                fn(snap);
            } else {
                print(`[TYPENET] ${name} request sent:`, snap);
            }
            return req;
        };

        return req;
    };

    const response = (fn: ((data: Req, player?: Player) => Res) | ((player?: Player) => Res)) => {
        let statsFn:
            | ((
                data: Req | undefined,
                stats: Types.PacketStats | undefined,
                player?: Player,
            ) => void)
            | undefined;

        const connection = createListener(
            requestId,
            `${name}/request`,
            {
                _nominal_codec: undefined as never,
                encode: (writer, value) => {
                    writer.u16((value as { corrId: number; value: Req | undefined }).corrId);
                    if (reqCodec)
                        reqCodec.encode(writer, (value as { corrId: number; value: Req }).value);
                },
                decode: (reader) => {
                    const corrId = reader.u16();
                    const value = reqCodec ? reqCodec.decode(reader) : undefined;
                    return { corrId, value };
                },
            } as Types.InternalCodec<{ corrId: number; value: Req | undefined }>,
            (data, player) => {
                const { corrId, value: reqData } = data as {
                    corrId: number;
                    value: Req | undefined;
                };

                const result = reqCodec
                    ? (fn as (data: Req, player?: Player) => Res)(reqData as Req, player)
                    : (fn as (player?: Player) => Res)(player);

                const codec: Types.InternalCodec<Res> = {
                    _nominal_codec: undefined as never,
                    encode: (writer, value) => {
                        writer.u16(corrId);
                        resCodec.encode(writer, value);
                    },
                    decode: (reader) => {
                        reader.u16();
                        return resCodec.decode(reader);
                    },
                };

                sendPacket(responseId, `${name}/response`, codec, false, result, player);

                if (statsFn) {
                    statsFn(reqData, getStats(`${name}/response`)?.snapshot(), player);
                }
            },
        );

        return {
            stats: (
                sf?: (
                    data: Req | undefined,
                    stats: Types.PacketStats | undefined,
                    player?: Player,
                ) => void,
            ): RBXScriptConnection => {
                statsFn =
                    sf ??
                    ((_data, stats, _player) => {
                        print(`[TYPENET] ${name} responded:`, stats);
                    });
                return connection;
            },
            Disconnect: () => connection.Disconnect(),
        };
    };
    return { request, response };
}

export default function Query<Res>(
    responseCodec: Types.Codec<Res>,
): Types.QueryDefinition<undefined, Res>;
export default function Query<Req, Res>(
    requestCodec: Types.Codec<Req>,
    responseCodec: Types.Codec<Res>,
): Types.QueryDefinition<Req, Res>;

export default function Query<Req, Res>(
    requestCodecOrResponseCodec: Types.Codec<any>,
    responseCodec?: Types.Codec<any>,
): Types.QueryDefinition<any, any> {
    if (responseCodec !== undefined) {
        return {
            _requestCodec: requestCodecOrResponseCodec as Types.Codec<Req>,
            _responseCodec: responseCodec as Types.Codec<Res>,
        };
    }
    return {
        _requestCodec: undefined,
        _responseCodec: requestCodecOrResponseCodec as Types.Codec<Res>,
    };
}
