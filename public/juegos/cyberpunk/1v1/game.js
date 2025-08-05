let socket;
let miNombre = "";
let nombreOponente = "";
let miTurno = false;
let juegoIniciado = false;
let contadorTurnos = 0;

function conectar() {
    const inputNombre = document.getElementById('nombre-jugador');
    miNombre = inputNombre.value.trim();

    if (!miNombre) {
        alert("Por favor, introduce tu nombre.");
        return;
    }

    socket = io("http://localhost:3000");

    const estado = document.getElementById('estado-conexion');
    estado.textContent = 'Conectando...';

    socket.on('connect', () => {
        estado.textContent = 'Conectado';
        socket.emit("nombre jugador", miNombre);
    });

    socket.on('disconnect', () => {
        estado.textContent = 'Desconectado';
    });

    socket.on('connect_error', () => {
        estado.textContent = 'Error de conexión';
    });

    socket.on("mensaje", (msg) => {
        console.log("Servidor dice:", msg);
        alert(msg);
    });

    socket.on("nombres jugadores", (nombres) => {
        miNombre = nombres.tu;
        nombreOponente = nombres.oponente;
        document.getElementById("nombres-jugadores").textContent =
            `Tú: ${miNombre} | Oponente: ${nombreOponente}`;
        document.getElementById("btn-iniciar").disabled = false;
    });

    socket.on("juego iniciado", (data) => {
        juegoIniciado = true;
        miTurno = (data.turnoDe === miNombre);
        contadorTurnos = data.contadorTurnos || 1;
        actualizarInfoTurno();
        actualizarContadorTurnos();
        document.getElementById("btn-finalizar-turno").disabled = !miTurno;
    });

    socket.on("cambio turno", (data) => {
        miTurno = (data.turnoDe === miNombre);
        contadorTurnos = data.contadorTurnos;
        actualizarInfoTurno();
        actualizarContadorTurnos();
        document.getElementById("btn-finalizar-turno").disabled = !miTurno;
    });

    socket.on("carta jugada", (data) => {
        alert(`Tu oponente jugó: ${data.nombre} (daño ${data.daño})`);
        // Cambia el turno al recibir jugada del oponente
        socket.emit("terminar turno");
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "j" && miTurno && juegoIniciado) {
            socket.emit("jugar carta", { nombre: "Espadazo", daño: 15 });
            miTurno = false;
            actualizarInfoTurno();
        }
    });
}

function iniciarJuego() {
    document.getElementById("btn-iniciar").disabled = true;
    socket.emit("iniciar juego");
}

function finalizarTurno() {
    if (miTurno && juegoIniciado) {
        socket.emit("terminar turno");
        document.getElementById("btn-finalizar-turno").disabled = true;
    }
}

function actualizarInfoTurno() {
    const info = document.getElementById("info-turno");
    if (!juegoIniciado) {
        info.textContent = "Esperando a que ambos jugadores inicien el juego...";
        document.getElementById("btn-finalizar-turno").disabled = true;
    } else if (miTurno) {
        info.textContent = "¡Es tu turno!";
        document.getElementById("btn-finalizar-turno").disabled = false;
    } else {
        info.textContent = "Esperando el turno del oponente...";
        document.getElementById("btn-finalizar-turno").disabled = true;
    }
}

function actualizarContadorTurnos() {
    document.getElementById("contador-turnos").textContent = "Turno: " + contadorTurnos;
}
