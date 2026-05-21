// Packages
import Lync from "@rbxts/lync";

const Network = {
	Info: Lync.packet(
		"DevLog/Info",
		Lync.struct({
			label: Lync.string,
			data: Lync.string,
			time: Lync.optional(Lync.int(0, 30)),
		}),
	),
	ServerError: Lync.packet("DevLog/ServerError", Lync.nothing),
};

export default Network;
