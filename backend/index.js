import express from "express";
import { WebSocketServer } from "ws";

const allowDomain = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header('Access-Control-Allow-Credentials', "true");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, Accept, Content-Type");
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

const web = new WebSocketServer({ noServer: true });

app.get("/chat", (req, res) => {
    web.handleUpgrade(req, req.socket, req.headers, (socket) => {
        socket.isAlive = true;
        
        socket.send(JSON.stringify({ message: "WebSocket connected" }));

        socket.on("close", (event) => {
            console.log("WebSocket closing");
            console.log(event)
            // clearInterval(interval);
        });

        socket.on("message", (data) => {
            data = JSON.parse(data);

            if (data.message==="ping") {
                console.log("Heartbeat received");
                socket.isAlive = true;
                socket.send(JSON.stringify({message: "pong"}))
            } else {
                console.log("Message:", data);
                web.clients.forEach((client) => {
                    if (client !== socket && client.readyState === client.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        });
    });
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
