// Package
import Object from "@rbxts/object-utils";
import { atom } from "@rbxts/charm";

const playersAtom = atom<Map<number, Type.Player.Data>>(new Map());

const PlayerState = {
	atom: playersAtom,

	set(player: Player, newData: Type.Player.Data) {
		playersAtom((current) => {
			const n = Object.deepCopy(current);
			n.set(player.UserId, newData);
			return n;
		});
	},
	update: (player: Player, updater: (data: Type.Player.Data) => Type.Player.Data) => {
		playersAtom((current) => {
			const n = Object.deepCopy(current);
			const data = n.get(player.UserId);
			if (!data) return current;
			n.set(player.UserId, updater(data));
			return n;
		});
	},
	remove: (player: Player) => {
		playersAtom((current) => {
			const n = Object.deepCopy(current);
			n.delete(player.UserId);
			return n;
		});
	},
};

export default PlayerState;
