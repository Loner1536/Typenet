const BASE_REMOTE_OVERHEAD = 9;
const REMOTEFUNCTION_OVERHEAD = 2;

const CLIENT_TO_SERVER_OVERHEAD = 5;
const TYPE_OVERHEAD = 1;

function getVLQSize(initialSize: number, length: number): number {
    return math.max(math.ceil(math.log(length + initialSize, 128)), initialSize);
}

export default function estimatePacketSize(
    runContext: "Client" | "Server",
    remoteType: "RemoteEvent" | "RemoteFunction",
    buf: buffer,
): number {
    let total = BASE_REMOTE_OVERHEAD;

    if (remoteType === "RemoteFunction") total += REMOTEFUNCTION_OVERHEAD;
    if (runContext === "Client") total += CLIENT_TO_SERVER_OVERHEAD;

    const len = buffer.len(buf);
    total += TYPE_OVERHEAD + getVLQSize(1, len) + len;

    return total;
}
