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
    print("Typenet", data, stats);
});

Network.Lync.unkown.send(data);
Network.Lync.unkown.on((data) => {
    print("Lync", data);
});
