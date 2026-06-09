//!optimize 2

// Package
import Typenet from "@rbxts/typenet";
import Lync from "@rbxts/lync";

// Shared
// import { blinkCases, extendedCases, handshake } from "@shared/scenarios";

// Typenet.start({ debug: false });
Lync.configure({ channelMaxSize: 1048576 });
Lync.start();

// for (const c of blinkCases) c.typenet.onRegister();
// for (const c of blinkCases) c.lync.onRegister();
//
// for (const c of extendedCases) c.typenet.onRegister();
// for (const c of extendedCases) c.lync.onRegister();
//
// handshake.ServerCpuDone.on(() => {
//     print("[client] benchmark complete");
// });
//
// handshake.ClientReady.send(true);
