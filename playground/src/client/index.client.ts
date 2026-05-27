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

const value = 0xffffff;

// Network.Typenet.u32.send(value);
// Network.Typenet.u32.on(() => { }).stats();

Network.Typenet.query
    .request()
    .stats()
    .then((data) => {
        print(`Query Client value: ${data}`);
    });

// Network.Lync.u32.send(value);
// Network.Lync.u32.on((data) => {
//     print("Lync", data);
// });
