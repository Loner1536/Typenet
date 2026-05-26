// Package
import Typenet from "@rbxts/typenet";
import Lync from "@rbxts/lync";

// Shared
import Network from "@shared/network";

Typenet.set({
    debug: true,
    stats: true,
});
Typenet.start();
Lync.start();

const data = "Hello";

Network.Typenet.unknown.send(data);
Network.Typenet.unknown.stats.on((data, stats) => {
    print(
        "Typenet",
        data,
        `raw: ${stats?.sentBytes.raw} overhead: ${stats?.sentBytes.overhead} total: ${stats?.sentBytes.total}`,
        stats,
    );
});

// task.delay(2, () => Network.Lync.unkown.send(data, Lync.all));
// Network.Lync.unkown.on((data) => {
//     print("Lync", data);
// });
