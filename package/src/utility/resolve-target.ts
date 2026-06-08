// Package
import { Players } from "@rbxts/services";

// Internal
import * as Type from "@type";

function isPlayer(value: unknown): value is Player {
    return typeIs(value, "Instance") && value.IsA("Player");
}

function isExcludeTuple(target: Type.Target): target is ["Exclude", Player | Player[]] {
    return typeIs(target, "table") && (target as defined[])[0] === "Exclude";
}

function isPlayerArray(value: Player | Player[]): value is Player[] {
    return typeIs(value, "table");
}

function resolveTarget(target: Type.Target | undefined): Player[] {
    if (target === undefined) return Players.GetPlayers();
    if (isPlayer(target)) return [target];

    if (isExcludeTuple(target)) {
        const excluded = target[1];
        const excludedArray = isPlayerArray(excluded) ? excluded : [excluded];
        const excludedSet = new Set<Player>(excludedArray);

        const result: Player[] = [];
        for (const player of Players.GetPlayers()) {
            if (!excludedSet.has(player)) {
                result.push(player);
            }
        }
        return result;
    }

    return target as Player[];
}

export default resolveTarget;
