// Internal
import * as Type from "@type";

// Codec
import Primitive from "@codec/primitive";
import vector3 from "./vector3";

function extractQuaternion(cf: CFrame): [number, number, number, number] {
    const [_, __, ___, r00, r01, r02, r10, r11, r12, r20, r21, r22] = cf.GetComponents();

    const trace = r00 + r11 + r22;
    let qx: number, qy: number, qz: number, qw: number;

    if (trace > 0) {
        const s = 0.5 / math.sqrt(trace + 1);
        qw = 0.25 / s;
        qx = (r21 - r12) * s;
        qy = (r02 - r20) * s;
        qz = (r10 - r01) * s;
    } else if (r00 > r11 && r00 > r22) {
        const s = 2 * math.sqrt(1 + r00 - r11 - r22);
        qw = (r21 - r12) / s;
        qx = 0.25 * s;
        qy = (r01 + r10) / s;
        qz = (r02 + r20) / s;
    } else if (r11 > r22) {
        const s = 2 * math.sqrt(1 + r11 - r00 - r22);
        qw = (r02 - r20) / s;
        qx = (r01 + r10) / s;
        qy = 0.25 * s;
        qz = (r12 + r21) / s;
    } else {
        const s = 2 * math.sqrt(1 + r22 - r00 - r11);
        qw = (r10 - r01) / s;
        qx = (r02 + r20) / s;
        qy = (r12 + r21) / s;
        qz = 0.25 * s;
    }

    return [qx, qy, qz, qw];
}

function cframe(
    positionCodec: Type.Codec.Vector3 = vector3,
    rotationCodec: Type.Codec.External<number> = Primitive.f32,
): Type.Codec.External<CFrame> {
    const internalPosition = positionCodec as unknown as Type.Codec.Internal<Vector3>;
    const internalRotation = rotationCodec as unknown as Type.Codec.Internal<number>;

    return {
        write: (writer, value) => {
            internalPosition.write(writer, value.Position);

            const [qx, qy, qz, qw] = extractQuaternion(value);
            const components = [qx, qy, qz, qw];

            let largestIndex = 0;
            let largestValue = math.abs(components[0]);
            for (let i = 1; i < 4; i++) {
                if (math.abs(components[i]) > largestValue) {
                    largestValue = math.abs(components[i]);
                    largestIndex = i;
                }
            }

            writer.u8(largestIndex);

            for (let i = 0; i < 4; i++) {
                if (i !== largestIndex) {
                    internalRotation.write(writer, components[i]);
                }
            }
        },
        read: (cursor) => {
            const pos = internalPosition.read(cursor);

            const largestIndex = cursor.u8();

            const values: number[] = [];
            for (let i = 0; i < 3; i++) {
                values[i] = internalRotation.read(cursor);
            }

            const sumSq = values[0] ** 2 + values[1] ** 2 + values[2] ** 2;
            const largest = math.sqrt(math.max(0, 1 - sumSq));

            const q: number[] = [];
            let vi = 0;
            for (let i = 0; i < 4; i++) {
                if (i === largestIndex) {
                    q[i] = largest;
                } else {
                    q[i] = values[vi++];
                }
            }

            return new CFrame(
                pos.X,
                pos.Y,
                pos.Z,
                1 - 2 * (q[1] ** 2 + q[2] ** 2),
                2 * (q[0] * q[1] - q[2] * q[3]),
                2 * (q[0] * q[2] + q[1] * q[3]),
                2 * (q[0] * q[1] + q[2] * q[3]),
                1 - 2 * (q[0] ** 2 + q[2] ** 2),
                2 * (q[1] * q[2] - q[0] * q[3]),
                2 * (q[0] * q[2] - q[1] * q[3]),
                2 * (q[1] * q[2] + q[0] * q[3]),
                1 - 2 * (q[0] ** 2 + q[1] ** 2),
            );
        },
        _default: new CFrame(),
    } as Type.Codec.Internal<CFrame> as Type.Codec.External<CFrame>;
}

export default setmetatable(cframe(), {
    __call: (_self, ...args: Array<unknown>) =>
        cframe(args[0] as Type.Codec.Vector3, args[1] as Type.Codec.External<number>),
}) as Type.Codec.CFrame;
