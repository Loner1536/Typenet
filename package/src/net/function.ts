// Package
import { RunService } from "@rbxts/services";

// Types
import * as Types from "../types";

// Transport
import { registerServerHandler, registerClientHandler, wrapDirect } from "../transport/bridge";
import { writeToPlayer, writeToPlayerDirect } from "../transport/server";
import { writeToServer, writeToServerDirect } from "../transport/client";
import { createReader } from "../transport/reader";

// Net
import { register } from "./registry";

/**
 * Represents a networked function that supports typed request/response communication.
 * Methods are only available on the correct context — `invoke` on the client,
 * `onInvoke` on the server.
 *
 * @example
 * const myFunc: NetFunction<string, number> = createFunction("MyNamespace", "MyFunc", { ... });
 */
export type NetFunction<TRequest, TResponse> = {
	/**
	 * Sends a request to the server and returns a promise that resolves with the response.
	 * Only callable on the client.
	 *
	 * @example
	 * const result = await myFunc.request("hello");
	 */
	request(request: TRequest): Promise<TResponse>;

	/**
	 * Registers the handler that processes incoming requests and returns a response.
	 * Only callable on the server.
	 *
	 * @example
	 * myFunc.response((player, request) => request.len());
	 */
	response(handler: (player: Player, request: TRequest) => TResponse): void;

	/** The codec used to encode and decode the request payload. `undefined` if the function carries no request data. */
	readonly requestCodec: Types.FunctionConfig<TRequest, TResponse>["request"];

	/** The codec used to encode and decode the response payload. `undefined` if the function carries no response data. */
	readonly responseCodec: Types.FunctionConfig<TRequest, TResponse>["response"];
};

/**
 * Creates a typed request/response function over the buffer transport.
 *
 * Each `invoke()` tags its payload with a u16 sequence ID, which the server echoes
 * back in the response so the client can resolve the correct promise. The counter
 * wraps at 65535 → 0, supporting up to 65535 simultaneous in-flight invocations.
 *
 * Wire format (client → server): [seqId: u16][request bytes...]
 * Wire format (server → client): [seqId: u16][response bytes...]
 *
 * @param namespaceName - The namespace this function belongs to.
 * @param funcName - The unique name of this function within the namespace.
 * @param config - Function configuration, including optional request and response codecs.
 *
 * @example
 * const myFunc = createFunction("MyNamespace", "MyFunc", {
 *     request: t.str(64),
 *     response: t.u32,
 * });
 * myFunc.onInvoke((player, request) => request.len()); // server
 * const result = await myFunc.invoke("hello");         // client
 */
export function createFunction<TRequest, TResponse>(
	namespaceName: string,
	funcName: string,
	config: Types.FunctionConfig<TRequest, TResponse>,
): NetFunction<TRequest, TResponse> {
	const batched = config.batch === true;
	const requestId = register(namespaceName, funcName, "function/request");
	const responseId = register(namespaceName, funcName, "function/response");

	const reqCodec = config.request as unknown as Types.InternalCodec<TRequest> | undefined;
	const resCodec = config.response as unknown as Types.InternalCodec<TResponse> | undefined;

	let nextSeqId = 0;
	const pending = new Map<number, (payload: buffer) => void>();

	function nextId(): number {
		const id = nextSeqId;
		nextSeqId = (nextSeqId + 1) % 65536;
		return id;
	}

	function encodeRequest(seqId: number, request: TRequest): buffer {
		const bodySize = reqCodec !== undefined ? reqCodec.measure(request) : 0;
		const buf = buffer.create(2 + bodySize);
		buffer.writeu16(buf, 0, seqId);
		if (reqCodec !== undefined) reqCodec.encode(buf, 2, request);
		return buf;
	}

	function encodeResponse(seqId: number, response: TResponse): buffer {
		const bodySize = resCodec !== undefined ? resCodec.measure(response) : 0;
		const buf = buffer.create(2 + bodySize);
		buffer.writeu16(buf, 0, seqId);
		if (resCodec !== undefined) resCodec.encode(buf, 2, response);
		return buf;
	}

	if (!RunService.IsServer()) {
		registerClientHandler(responseId, (payload) => {
			const reader = createReader(payload);
			const seqId = reader.readu16();
			const resolver = pending.get(seqId);

			if (resolver !== undefined) {
				pending.delete(seqId);
				resolver(payload);
			}
		});
	}

	return {
		request(request: TRequest): Promise<TResponse> {
			assert(
				!RunService.IsServer(),
				`[Net] "${namespaceName}/${funcName}": invoke() must be called from the client`,
			);

			return new Promise((resolve) => {
				const seqId = nextId();
				pending.set(seqId, (payload) => {
					const reader = createReader(payload);
					reader.readu16();
					const response =
						resCodec !== undefined ? resCodec.decode(reader) : (undefined as unknown as TResponse);
					resolve(response);
				});

				if (batched) {
					writeToServer(requestId, encodeRequest(seqId, request));
				} else {
					writeToServerDirect(wrapDirect(requestId, encodeRequest(seqId, request)));
				}
			});
		},

		response(handler: (player: Player, request: TRequest) => TResponse): void {
			assert(
				RunService.IsServer(),
				`[Net] "${namespaceName}/${funcName}": onInvoke() must be called from the server`,
			);

			registerServerHandler(requestId, (player, payload) => {
				const reader = createReader(payload);
				const seqId = reader.readu16();
				const request =
					reqCodec !== undefined ? reqCodec.decode(reader) : (undefined as unknown as TRequest);
				const response = handler(player, request);

				if (batched) {
					writeToPlayer(player, responseId, encodeResponse(seqId, response));
				} else {
					writeToPlayerDirect(player, wrapDirect(responseId, encodeResponse(seqId, response)));
				}
			});
		},

		requestCodec: config.request,
		responseCodec: config.response,
	};
}
