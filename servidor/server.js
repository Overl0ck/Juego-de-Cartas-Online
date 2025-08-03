// servidor/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, '../public')));

// Cola de emparejamiento
let jugadoresEsperando = null;
// Añade estas variables globales
let salas = {}; // { roomId: { jugadoresListos: Set, turnoDe: nombre } }

io.on('connection', (socket) => {
    socket.nombre = null;
    socket.room = null;

    // Recibir nombre del jugador
    socket.on("nombre jugador", (nombre) => {
        socket.nombre = nombre;

        // Si ya está emparejado y ambos tienen nombre, enviar nombres a ambos
        if (socket.room) {
            enviarNombresAJugadores(socket.room);
        }
    });

    // Emparejar jugadores
    if (jugadoresEsperando === null) {
        jugadoresEsperando = socket;
        socket.emit("mensaje", "Esperando a otro jugador...");
    } else {
        const jugador1 = jugadoresEsperando;
        const jugador2 = socket;

        const room = `sala-${jugador1.id}-${jugador2.id}`;
        jugador1.join(room);
        jugador2.join(room);

        jugador1.emit("mensaje", "¡Conectado con otro jugador!");
        jugador2.emit("mensaje", "¡Conectado con otro jugador!");

        jugador1.room = room;
        jugador2.room = room;

        jugadoresEsperando = null;

        console.log(`Emparejados en sala: ${room}`);

        // Si ambos ya enviaron su nombre, enviar nombres
        enviarNombresAJugadores(room);
    }

    socket.on("iniciar juego", () => {
        if (!socket.room) return;
        if (!salas[socket.room]) {
            salas[socket.room] = { jugadoresListos: new Set(), turnoDe: null, contadorTurnos: 0 };
        }
        salas[socket.room].jugadoresListos.add(socket.id);

        // Cuando ambos jugadores han pulsado "Iniciar juego"
        if (salas[socket.room].jugadoresListos.size === 2) {
            // Decide aleatoriamente quién empieza
            const sockets = Array.from(io.sockets.adapter.rooms.get(socket.room) || [])
                .map(id => io.sockets.sockets.get(id));
            const primero = Math.random() < 0.5 ? sockets[0] : sockets[1];
            salas[socket.room].turnoDe = primero.nombre;
            salas[socket.room].contadorTurnos = 1; // Primer turno
            io.to(socket.room).emit("juego iniciado", { turnoDe: primero.nombre, contadorTurnos: 1 });
        }
    });

    socket.on("terminar turno", () => {
        if (!socket.room || !salas[socket.room]) return;
        // Cambia el turno al otro jugador
        const sockets = Array.from(io.sockets.adapter.rooms.get(socket.room) || [])
            .map(id => io.sockets.sockets.get(id));
        const siguiente = sockets.find(s => s.nombre !== salas[socket.room].turnoDe);
        salas[socket.room].turnoDe = siguiente.nombre;
        salas[socket.room].contadorTurnos += 1;
        io.to(socket.room).emit("cambio turno", { turnoDe: siguiente.nombre, contadorTurnos: salas[socket.room].contadorTurnos });
    });

    // Evento: recibir carta jugada
    socket.on("jugar carta", (data) => {
        if (socket.room) {
            socket.to(socket.room).emit("carta jugada", data);
        }
    });

    socket.on("disconnect", () => {
        console.log("Jugador desconectado:", socket.id);
        if (jugadoresEsperando === socket) {
            jugadoresEsperando = null;
        } else if (socket.room) {
            const room = socket.room;
            socket.to(room).emit("mensaje", "El jugador ha salido de la sala.");
            socket.leave(room);
            // Eliminar sala si existe
            if (salas[room]) {
                delete salas[room];
            }
        }
    });

    // Función para enviar los nombres a ambos jugadores de la sala
    function enviarNombresAJugadores(room) {
        const sockets = Array.from(io.sockets.adapter.rooms.get(room) || [])
            .map(id => io.sockets.sockets.get(id));
        if (sockets.length === 2 && sockets[0].nombre && sockets[1].nombre) {
            sockets[0].emit("nombres jugadores", { tu: sockets[0].nombre, oponente: sockets[1].nombre });
            sockets[1].emit("nombres jugadores", { tu: sockets[1].nombre, oponente: sockets[0].nombre });
        }
    }
});

server.listen(3000, () => {
    console.log("Servidor en puerto 3000");
});
