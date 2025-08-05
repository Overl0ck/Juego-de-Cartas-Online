const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Namespaces para juegos
const cyberpunkNamespace = io.of("/cyberpunk");
const medievalNamespace = io.of("/medieval");

inicializarModo1v1(cyberpunkNamespace, "Cyberpunk");
inicializarModo1v1(medievalNamespace, "Medieval");

function inicializarModo1v1(namespace, nombreJuego) {
  let jugadoresEsperando = null;
  let salas = {};

  namespace.on("connection", (socket) => {
    console.log(`🟢 [${nombreJuego}] Nuevo cliente conectado - ID: ${socket.id}`);

    socket.on("nombre jugador", (nombre) => {
      socket.nombre = nombre;
      console.log(`👤 [${nombreJuego}] Jugador ${socket.id} se identificó como "${nombre}"`);

      if (socket.sala) {
        console.log(`↪️ [${nombreJuego}] Reenviando nombres en sala ${socket.sala}`);
        enviarNombresAJugadores(socket.sala);
      }
    });

    // Emparejar jugadores
    if (jugadoresEsperando === null) {
      jugadoresEsperando = socket;
      socket.emit("mensaje", "Esperando a otro jugador...");
      console.log(`⏳ [${nombreJuego}] Jugador ${socket.id} esperando emparejamiento`);
    } else {
      const jugador1 = jugadoresEsperando;
      const jugador2 = socket;

      const salaId = `sala-${jugador1.id}-${jugador2.id}`;
      jugador1.join(salaId);
      jugador2.join(salaId);
      jugador1.sala = salaId;
      jugador2.sala = salaId;

      jugadoresEsperando = null;

      salas[salaId] = {
        jugadoresListos: new Set(),
        turnoDe: null,
        contadorTurnos: 1
      };

      console.log(`✅ [${nombreJuego}] Sala creada: ${salaId}`);
      console.log(`👥 [${nombreJuego}] Jugadores emparejados: ${jugador1.nombre} (${jugador1.id}) y ${jugador2.nombre} (${jugador2.id})`);

      jugador1.emit("mensaje", "¡Emparejado con otro jugador!");
      jugador2.emit("mensaje", "¡Emparejado con otro jugador!");

      enviarNombresAJugadores(salaId);
    }

    socket.on("iniciar juego", () => {
      const salaId = socket.sala;
      if (!salaId || !salas[salaId]) return;

      salas[salaId].jugadoresListos.add(socket.id);
      console.log(`🟡 [${nombreJuego}] ${socket.nombre} ha pulsado "Iniciar juego" en sala ${salaId}`);

      const sockets = Array.from(namespace.adapter.rooms.get(salaId) || [])
        .map(id => namespace.sockets.get(id));

      // Avisar al oponente si aún no ha pulsado "iniciar"
      const oponente = sockets.find(s => s.id !== socket.id && !salas[salaId].jugadoresListos.has(s.id));
      if (oponente) {
        oponente.emit("mensaje", `${socket.nombre} está listo. ¡Pulsa "Iniciar juego" para comenzar!`);
        console.log(`📨 [${nombreJuego}] Se notificó a ${oponente.nombre} que ${socket.nombre} está listo`);
      }

      // Si ambos están listos, iniciar juego
      if (salas[salaId].jugadoresListos.size === 2) {
        const primero = Math.random() < 0.5 ? sockets[0] : sockets[1];
        salas[salaId].turnoDe = primero.nombre;

        console.log(`🚀 [${nombreJuego}] Juego iniciado en sala ${salaId}`);
        console.log(`🎯 [${nombreJuego}] Primer turno: ${primero.nombre}`);

        namespace.to(salaId).emit("juego iniciado", {
          turnoDe: primero.nombre,
          contadorTurnos: 1
        });
      }
    });

    socket.on("terminar turno", () => {
      const salaId = socket.sala;
      if (!salaId || !salas[salaId]) return;

      const sockets = Array.from(namespace.adapter.rooms.get(salaId))
        .map(id => namespace.sockets.get(id));
      const siguiente = sockets.find(s => s.nombre !== salas[salaId].turnoDe);

      salas[salaId].turnoDe = siguiente.nombre;
      salas[salaId].contadorTurnos += 1;

      console.log(`🔁 [${nombreJuego}] Turno cambiado en sala ${salaId} → Turno de ${siguiente.nombre}, Turno #${salas[salaId].contadorTurnos}`);

      namespace.to(salaId).emit("cambio turno", {
        turnoDe: siguiente.nombre,
        contadorTurnos: salas[salaId].contadorTurnos
      });
    });

    socket.on("jugar carta", (data) => {
      const salaId = socket.sala;
      if (salaId) {
        console.log(`🃏 [${nombreJuego}] ${socket.nombre} jugó una carta en sala ${salaId}:`, data);
        socket.to(salaId).emit("carta jugada", data);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 [${nombreJuego}] Jugador desconectado - ID: ${socket.id} (${socket.nombre || "sin nombre"})`);

      if (jugadoresEsperando === socket) {
        jugadoresEsperando = null;
      }

      const salaId = socket.sala;
      if (salaId) {
        socket.to(salaId).emit("mensaje", "El jugador se ha desconectado.");
        delete salas[salaId];
        console.log(`⚠️ [${nombreJuego}] Sala ${salaId} eliminada por desconexión`);
      }
    });

    function enviarNombresAJugadores(salaId) {
      const sockets = Array.from(namespace.adapter.rooms.get(salaId) || [])
        .map(id => namespace.sockets.get(id));

      if (sockets.length === 2 && sockets[0].nombre && sockets[1].nombre) {
        sockets[0].emit("nombres jugadores", {
          tu: sockets[0].nombre,
          oponente: sockets[1].nombre
        });
        sockets[1].emit("nombres jugadores", {
          tu: sockets[1].nombre,
          oponente: sockets[0].nombre
        });

        console.log(`📨 [${nombreJuego}] Nombres enviados: ${sockets[0].nombre} vs ${sockets[1].nombre} en sala ${salaId}`);
      } else {
        console.log(`⚠️ [${nombreJuego}] No se pudieron enviar nombres, jugadores incompletos en sala ${salaId}`);
      }
    }
  });
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🧠 Servidor escuchando en http://localhost:${PORT}`);
});
