const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 3000 }, () => {
    console.log("🟢 Servidor WebSocket activo en ws://localhost:3000");
}); 
 
// Map para usuarios conectados (socket -> nombre)
const usuarios = new Map();
// Set para todos los usuarios (conectados o desconectados)
const todosLosUsuarios = new Set();

function broadcastUsuarios() {
    const conectados = Array.from(usuarios.values());
    const todos = Array.from(todosLosUsuarios);

    const mensaje = JSON.stringify({
        tipo: "usuarios",
        conectados,
        todos
    });

    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(mensaje);
        }
    });
}

server.on("connection", (socket) => {
    console.log("✅ Cliente conectado");

    socket.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.tipo === "nuevo-usuario") {
                usuarios.set(socket, data.nombre);
                todosLosUsuarios.add(data.nombre);
                broadcastUsuarios();
                return;
            }

            if (data.tipo === "mensaje") {
                const nombre = usuarios.get(socket) || "Anónimo";
                const mensajeTexto = JSON.stringify({
                    tipo: "mensaje",
                    nombre,
                    texto: data.texto,
                });

                server.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(mensajeTexto);
                    }
                });
            }
        } catch (e) {
            console.error("❌ Error procesando mensaje:", e);
        }
    });

    socket.on("close", () => {
        console.log("❌ Cliente desconectado");
        usuarios.delete(socket);
        broadcastUsuarios();
    });
});
