// Types
import * as Types from "../types";

/** Encodes/decodes a boolean. Wire size: 1 byte. */
export const bool: Types.Codec<boolean> = ((): Types.InternalCodec<boolean> => ({
	encode(buf, offset, value) {
		buffer.writeu8(buf, offset, value ? 1 : 0);
	},
	decode(reader) {
		return reader.readbool();
	},
	measure() {
		return 1;
	},
}))() as unknown as Types.Codec<boolean>;
