// Transport
import { register } from "../transport/registry";

export default class Channel {
	constructor(name: string) {
		register((player, buffer) => {});
	}
}
