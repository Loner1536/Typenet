// Internal
import Constant from "@constant";

type Severity = "debug" | "warn" | "kick" | "fatal";

type LogContext = {
    player?: Player;
    [key: string]: unknown;
};

const CODE_WIDTH = 22;
const PLAYER_WIDTH = 14;
const PREFIX = Constant.LIB_NAME;

let debugEnabled = false;

function pad(s: string, width: number): string {
    let result = s;
    while (result.size() < width) result += " ";
    return result;
}

function formatContext(context: LogContext): string {
    const parts: string[] = [];
    for (const [key, value] of pairs(context)) {
        if (key === "player") continue;
        parts.push(`${key}=${tostring(value)}`);
    }
    return parts.join(" ");
}

function log(severity: Severity, code: string, context: LogContext = {}) {
    if (severity === "debug" && !debugEnabled) return;

    const playerName = context.player !== undefined ? `[${context.player.Name}]` : "";
    const playerSlot = pad(playerName, PLAYER_WIDTH);
    const details = formatContext(context);

    const tag = severity === "debug" ? "·" : `[${PREFIX}]`;
    const paddedCode = pad(code, CODE_WIDTH);
    const detailsPart = details !== "" ? ` · ${details}` : "";

    const message = `${tag} ${playerSlot} ${paddedCode}${detailsPart}`;

    if (severity === "warn" || severity === "kick") {
        warn(message);
    } else {
        print(message);
    }

    if (severity === "kick" && context.player !== undefined) {
        context.player.Kick(`Network violation: ${code}`);
    }

    if (severity === "fatal") {
        error(message);
    }
}

function setDebug(enabled: boolean) {
    debugEnabled = enabled;
}

const Report = {
    log,
    setDebug,
};

export default Report;
