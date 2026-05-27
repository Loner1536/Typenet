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

// Network.Typenet.u32.send(value).stats();
// Network.Typenet.u32.on(() => { });

Network.Typenet.query.response(() => {
    error("Test error");
});

// task.delay(2, () => Network.Lync.u32.send(value, Lync.all));
// Network.Lync.u32.on((data) => {
//     print("Lync", data);
// });
