// Dev-only "Dev stub" - mocks both wire protocols the Control UI speaks to
// the real firmware, so the whole frontend (Settings page AND boat control)
// can be built, driven, and debugged locally without a flashed board:
//   - /api/settings GET/POST  (see MiniKenterpriseCode/FrontendServer.h)
//   - the boat-control WebSocket on :81 (see MiniKenterpriseCode/Parser.h)
// See docs/adr/0005-unify-dev-stub-for-boat-control-and-settings.md.
import { createServer } from "node:http";
import { parse as parseQuery } from "node:querystring";
import { WebSocketServer } from "ws";
import { Parser, Communication_Commands } from "./src/my_modules/parser.js";

const SETTINGS_PORT = 8787;
const CONTROL_PORT = 81;
const STATUS_INTERVAL_MS = 1000;

const commandNameById = Object.fromEntries(
    Object.entries(Communication_Commands).map(([name, id]) => [id, name])
);

// --- Settings HTTP mock (unchanged protocol/behavior from settings-stub.js) ---

// Mirrors MiniKenterpriseCode/Config.h's compile-time defaults.
let settings = {
    apMode: "1",
    apSsid: "MiniKenterprise_1",
    apPassword: "RowYourBoat",
    staSsid: "",
    staPassword: "",
    motorEn: "15",
    motorIn1: "13",
    motorIn2: "12",
    motorIn3: "14",
    motorIn4: "16",
    ledCount: "8",
    regularPwmLimitPercent: "75",
    boostPwmLimitPercent: "100",
};

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", chunk => (body += chunk));
        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

const settingsServer = createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/api/settings") {
        const text = Object.entries(settings)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n") + "\n";
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end(text);
        return;
    }

    if (request.method === "POST" && request.url === "/api/settings/save") {
        const body = await readBody(request);
        const fields = parseQuery(body);
        for (const key of Object.keys(settings)) {
            if (key in fields) settings[key] = String(fields[key]);
        }
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end("Settings saved, restarting...");
        return;
    }

    response.writeHead(404, { "Content-Type": "text/plain" });
    response.end("404: Not Found");
});

settingsServer.listen(SETTINGS_PORT, () => {
    console.log(`[settings] listening on http://localhost:${SETTINGS_PORT}`);
});

// --- Boat-control WebSocket mock ---

const parser = new Parser();

function driftPercentage(value, step) {
    const next = value + (Math.random() * 2 - 1) * step;
    return Math.min(100, Math.max(0, next));
}

function driftValue(value, min, max, step) {
    const next = value + (Math.random() * 2 - 1) * step;
    return Math.min(max, Math.max(min, next));
}

// batteryVoltageMv drifts within a plausible single-cell Li-Ion range (matches
// MiniKenterpriseCode/Battery.h's lookup table: 2500mV empty - 4200mV full).
const simulated = { battery: 80, network: 90, batteryVoltageMv: 3900 };

// Mirrors PropulsionSystem's boost state machine (MiniKenterpriseCode/Config.h's
// BOOST_DURATION_MS/BOOST_COOLDOWN_MS) so local dev testing shows the same READY -> ACTIVE ->
// COOLDOWN -> READY cycle the real firmware would, without real hardware.
const BOOST_DURATION_MS = 10000;
const BOOST_COOLDOWN_MS = 30000;
const BoostState = { READY: 0, ACTIVE: 1, COOLDOWN: 2 };
let boostState = BoostState.READY;
let boostStateChangedAt = Date.now();

function requestBoost() {
    if (boostState === BoostState.READY) {
        boostState = BoostState.ACTIVE;
        boostStateChangedAt = Date.now();
        console.log("[control] boost requested -> ACTIVE");
    }
}

function updateBoostState() {
    const elapsedMs = Date.now() - boostStateChangedAt;
    if (boostState === BoostState.ACTIVE && elapsedMs > BOOST_DURATION_MS) {
        boostState = BoostState.COOLDOWN;
        boostStateChangedAt = Date.now();
        console.log("[control] boost -> COOLDOWN");
    } else if (boostState === BoostState.COOLDOWN && elapsedMs > BOOST_COOLDOWN_MS) {
        boostState = BoostState.READY;
        console.log("[control] boost -> READY");
    }
}

function getBoostSecondsRemaining() {
    let durationMs = 0;
    if (boostState === BoostState.ACTIVE) durationMs = BOOST_DURATION_MS;
    else if (boostState === BoostState.COOLDOWN) durationMs = BOOST_COOLDOWN_MS;
    else return 0;

    const remainingMs = Math.max(0, durationMs - (Date.now() - boostStateChangedAt));
    return Math.ceil(remainingMs / 1000);
}

function logIncoming(raw) {
    const command = parser.decodeCommand(raw);
    const name = commandNameById[command.id] ?? `unknown(${command.id})`;
    const params = command.parameters.join(" ");
    console.log(`[control] recv: ${name}${params ? " " + params : ""}`);
    return command;
}

const controlServer = new WebSocketServer({ port: CONTROL_PORT });

controlServer.on("connection", socket => {
    console.log("[control] client connected");

    socket.on("message", data => {
        const command = logIncoming(data.toString());

        if (command.id === Communication_Commands.Heartbeat) {
            const reply = parser.getHeartbeatCommand();
            socket.send(parser.encodeCommand(reply));
        }

        const isMovementCommand = command.id === Communication_Commands.ControlLR
            || command.id === Communication_Commands.ControlSD;
        if (isMovementCommand && command.parameters.length > 2 && Number(command.parameters[2]) === 1) {
            requestBoost();
        }
    });

    socket.on("close", () => {
        console.log("[control] client disconnected");
    });
});

setInterval(() => {
    simulated.battery = driftPercentage(simulated.battery, 2);
    simulated.network = driftPercentage(simulated.network, 5);
    simulated.batteryVoltageMv = driftValue(simulated.batteryVoltageMv, 2500, 4200, 60);
    updateBoostState();

    const status = parser.generateEmptyCommand();
    status.id = Communication_Commands.Status;
    status.parameterCount = 5;
    status.parameters.push(
        Math.round(simulated.battery),
        Math.round(simulated.network),
        Math.round(simulated.batteryVoltageMv),
        boostState,
        getBoostSecondsRemaining()
    );
    const encoded = parser.encodeCommand(status);

    for (const socket of controlServer.clients) {
        if (socket.readyState === socket.OPEN) socket.send(encoded);
    }
}, STATUS_INTERVAL_MS);

console.log(`[control] listening on ws://localhost:${CONTROL_PORT}`);
