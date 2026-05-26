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

const value = 255;

Network.Typenet.u8.send(value).stats();
Network.Typenet.u8.on(() => { }).stats();

Network.Lync.u8.send(value);
Network.Lync.u8.on((data) => {
    print("Lync", data);
});
