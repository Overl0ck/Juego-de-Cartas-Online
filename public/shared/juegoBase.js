export function iniciarJuegoBase(ioNamespace) {
  let socket;
  let miNombre = "";
  let nombreOponente = "";
  let miTurno = false;
  let juegoIniciado = false;
  let contadorTurnos = 0;

  window.conectar = function () {
    const inputNombre = document.getElementById('nombre-jugador');
    miNombre = inputNombre.value.trim();
    if (!miNombre) return alert("Por favor, introduce tu nombre.");
    socket = io("http://localhost:3000" + ioNamespace);

    document.getElementById("estado-conexion").textContent = "Conectando...";

    socket.on("connect", () => {
      document.getElementById("estado-conexion").textContent = "Conectado";
      socket.emit("nombre jugador", miNombre);
      document.getElementById("btn-desconectar").disabled = false;
    });

    socket.on("disconnect", () => {
      document.getElementById("estado-conexion").textContent = "Desconectado";
      document.getElementById("btn-desconectar").disabled = true;
    });

    socket.on("connect_error", () => {
      document.getElementById("estado-conexion").textContent = "Error de conexión";
    });

    socket.on("mensaje", (msg) => alert(msg));

    socket.on("nombres jugadores", (nombres) => {
      miNombre = nombres.tu;
      nombreOponente = nombres.oponente;
      
     document.querySelectorAll(".nombres-jugadores").forEach(el => {
        el.textContent = `Tú: ${miNombre} | Oponente: ${nombreOponente}`;
      });

      document.getElementById("btn-iniciar").disabled = false;
    });

    socket.on("juego iniciado", (data) => {
      juegoIniciado = true;
      miTurno = (data.turnoDe === miNombre);
      contadorTurnos = data.contadorTurnos || 1;
      actualizarInfoTurno();
      actualizarContadorTurnos();
      document.getElementById("btn-finalizar-turno").disabled = !miTurno;
      document.getElementById("pantalla-inicial").style.display = "none";
      document.getElementById("pantalla-juego").style.display = "block";
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
      socket.emit("terminar turno");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "j" && miTurno && juegoIniciado) {
        socket.emit("jugar carta", { nombre: "Espadazo", daño: 15 });
        miTurno = false;
        actualizarInfoTurno();
      }
    });
  };

  window.iniciarJuego = function () {
    socket.emit("iniciar juego");
    document.getElementById("btn-iniciar").disabled = true;
  };

  window.finalizarTurno = function () {
    if (miTurno) {
      socket.emit("terminar turno");
      document.getElementById("btn-finalizar-turno").disabled = true;
    }
  };

  window.desconectar = function () {
    if (socket) {
      socket.disconnect();
      socket = null;
      document.getElementById("estado-conexion").textContent = "Desconectado";
    }
  };

  window.volverAPantallaPrincipal = function () {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    document.getElementById("pantalla-juego").style.display = "none";
    document.getElementById("pantalla-inicial").style.display = "block";
    document.getElementById("nombre-jugador").value = "";
    document.getElementById("estado-conexion").textContent = "Desconectado";
    document.getElementById("nombres-jugadores").textContent = "";
    document.getElementById("info-turno").textContent = "Esperando...";
    document.getElementById("contador-turnos").textContent = "Turno: 0";
    document.getElementById("btn-iniciar").disabled = true;
    document.getElementById("btn-finalizar-turno").disabled = true;
  };

  window.volverASeleccion = function () {
    if (socket) socket.disconnect();
    window.location.href = '../../../index.html';
  };

  function actualizarInfoTurno() {
    const info = document.getElementById("info-turno");
    info.textContent = juegoIniciado
      ? (miTurno ? "¡Es tu turno!" : "Esperando al oponente...")
      : "Esperando a que ambos jugadores inicien el juego...";
  }

  function actualizarContadorTurnos() {
    document.getElementById("contador-turnos").textContent = "Turno: " + contadorTurnos;
  }
}
