const ws = new WebSocket("ws://localhost:4000/chat");

const HEARTBEAT_TIMEOUT = 6 * 1000; // 6 seconds

const sendMessage = (msg) => {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(msg));
    }
};

ws.onclose = (event) => {
    console.log("WebSocket closed", event);
    if (ws.pingTimeout) {
        clearTimeout(ws.pingTimeout);
    }
};

ws.onopen = (event) => {
    console.log("WebSocket connected", event.type);
    setInterval(() => {
        if (ws) {
            sendMessage({ message: "ping" });
        }
    }, HEARTBEAT_TIMEOUT);
};

ws.onerror = (event) => {
    console.log("WebSocket error", event);
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("Message:", message);
};

const sendHelloMessage = () => {
    console.log("Sending message");
    sendMessage({ message: "Hello, WebSocket!" });
};
