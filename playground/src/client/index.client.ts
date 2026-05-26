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

const unknown = "Unknown";
const str = "String";

// Network.Typenet.unknown.send(str);
Network.Typenet.unknown.stats.on((_data, stats) => {
    print("Typenet", stats);
});

// Network.Typenet.string.send(str);
// Network.Typenet.string.stats.on((_data, stats) => {
//     print("Typenet", stats);
// });

// Network.Lync.unknown.send(unknown);
// Network.Lync.unknown.on((data) => {
//     print("Lync", data);
// });

// Network.Lync.string.send(str);
// Network.Lync.string.on((data) => {
//     print("Lync", data);
// });
