import express from "express";
import { WebSocketServer } from "ws";

const allowDomain = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, Accept, Content-Type",
    );
    if (req.method.toLowerCase() === "options") return res.sendStatus(204);
    next();
};

const heartBeatInterval = 1000 * 5; // 5 seconds
const heartBeatValue = 1;

const ping = (ws) => {
    ws.send(JSON.stringify({ binary: true }));
};

const app = express();
app.use(allowDomain);
app.use(express.static(".."));

const server = app.listen(4000, () => {
    console.log("Server is running on port 4000");
});

const web = new WebSocketServer({ noServer: true, skipUTF8Validation: true });

server.on("upgrade", (req, socket, headers) => {
    console.log("upgrade hit", req.url);

    // client -> get /chat | header = upgrade
    // server sends to client 101

    if (req.url !== "/chat") return;

    web.handleUpgrade(req, socket, headers, (socket) => {
        socket.on("open", () => {
            socket.send(JSON.stringify({ message: "WebSocket connected" }));
        });

        socket.on("error", (event) => {
            console.log("WebSocket erorr", event);
        });

        socket.on("close", (event) => {
            console.log("WebSocket closing", event);
        });

        socket.on("message", (data) => {
            try {
                if (
                    socket.readyState === socket.CLOSED ||
                    socket.readyState === socket.CLOSING
                ) {
                    console.log(
                        "socket is closing or closed",
                        socket.readyState,
                    );
                    return;
                }

                data = JSON.parse(data);

                if (data.message === "ping") {
                    console.log("Heartbeat received");
                    socket.send(JSON.stringify({ message: "pong" }));
                } else {
                    console.log("Message:", data);
                    web.clients.forEach((client) => {
                        if (
                            client !== socket &&
                            client.readyState === client.OPEN
                        ) {
                            client.send(JSON.stringify(data));
                        }
                    });
                }
            } catch (error) {
                console.log("Message parsing failed with err", error);
            }
        });
    });

    // res.sendStatus(101);
});

app.get("/chat", (req, _) => {
});

// const interval = setInterval(() => {
//     web.clients.forEach((client) => {
//         if (!client.isAlive) {
//             client.terminate();
//             return;
//         }
//         client.isAlive = false;
//         ping(client);
//     });
// }, heartBeatInterval);
