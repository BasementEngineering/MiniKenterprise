// Dev-only "Settings stub" - fakes the on-device /api/settings GET/POST
// protocol (see MiniKenterpriseCode/FrontendServer.h) from an in-memory
// object, so the Settings page can be built and tested locally without a
// flashed board. See docs/adr/0004-settings-stub-for-local-dev.md.
import { createServer } from "node:http";
import { parse as parseQuery } from "node:querystring";

const PORT = 8787;

// Mirrors MiniKenterpriseCode/Config.h's compile-time defaults.
let settings = {
    apMode: "1",
    apSsid: "MiniKenterprise_1",
    apPassword: "RowYourBoat",
    staSsid: "",
    staPassword: "",
    motorEn: "15",
    motorIn1: "13",
    motorIn2: "0",
    motorIn3: "14",
    motorIn4: "12",
    ledPin: "2",
    ledCount: "8",
};

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", chunk => (body += chunk));
        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

const server = createServer(async (request, response) => {
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

server.listen(PORT, () => {
    console.log(`Settings stub listening on http://localhost:${PORT}`);
});
