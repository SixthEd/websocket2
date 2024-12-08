import express from "express";
import { WebSocketServer } from "ws";


const allowDomain = (req, res, next) => {
    // res.header("Access-Control-Allow-Headers", "*"); 
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header('Access-Control-Allow-Credentials', "true");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    //
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    if (req.method.toLowerCase() === "options") return res.sendStatus(204);
    next();
}

const heartBeatInterval = 30000;
const heartBeatValue = 1;

function ping(ws) {
    ws.send(heartBeatValue, { binary: true });
}

const app = express();

app.use(allowDomain);

app.use(express.static("."));

const server = app.listen(4000, () => {
    console.log("server is running");
})

const web = new WebSocketServer({
    noServer: true
})

app.get("/chat", (req, res) => {

    web.handleUpgrade(req, req.socket, new Buffer(""), (socket, incoming) => {

        socket.isAlive = true;

        socket.send(JSON.stringify({ message: " websocket connected" }))



        socket.on("close", () => {
            console.log(" websocket closing")
        })

        socket.on("message", (message, isBinary) => {
            if (isBinary && message === heartBeatValue) {
                console.log("pong");
                socket.isAlive= true;
            }   
            else {
                message = JSON.parse(message);
                console.log(message);
                web.clients.forEach((client) => {
                    if (client !== socket && client.readyState === socket.OPEN) {
                        client.send(JSON.stringify(message))
                    }
                })
            }

        })
    })
})

const interval = setInterval(() => {
    web.clients.forEach((client) => {
        console.log("firing interval")
        if (!client.isAlive) {
            client.terminate();
            return;
        }
        client.isAlive = false;
        ping(client)
    })
}, heartBeatInterval)