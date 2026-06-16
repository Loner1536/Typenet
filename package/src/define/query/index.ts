// Internal
import type * as Type from "@type";

// Binary
import Registry from "@binary/registry";

export function query<TReq, TRes>(
    request: Type.Codec.External<TReq>,
    response: Type.Codec.External<TRes>,
): Type.Query.Definition<TReq, TRes> {
    return {
        request: request as Type.Codec.Internal<TReq>,
        response: response as Type.Codec.Internal<TRes>,

        _kind: "Query",
    };
}
