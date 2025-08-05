# 🃏 Juego de Cartas Online

Este es un juego multijugador por turnos creado con **Node.js**, **Socket.IO** y **JavaScript web**, inspirado en juegos tipo Hearthstone. Permite que dos jugadores se enfrenten online en tiempo real, seleccionando entre modos de juego (como Cyberpunk o Medieval).

## 🚀 Características

- Juego multijugador 1v1 en tiempo real
- Turnos alternos con control total
- Nombres visibles para ambos jugadores
- Selección de modo de juego
- Sistema de salas automáticas
- Preparado para expansión con base de datos (SQLite)

---

## 🧱 Estructura del proyecto

/juego-de-cartas-online
│
├── public/ # Archivos públicos
│ ├── index.html # Pantalla de selección de modo
│ ├── cyberpunk/ # Archivos del modo Cyberpunk
│ └── medieval/ # Archivos del modo Medieval
│
├── server.js # Servidor principal con Socket.IO
├── package.json # Dependencias del proyecto
└── README.md # Este archivo


---

## 🖥️ Requisitos

- Node.js (v18 o superior recomendado)
- Git (si clonas el repo)

---

## 🔧 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Overl0ck/Juego-de-Cartas-Online.git
cd Juego-de-Cartas-Online

2. Instalar dependencias
npm install

3. Ejecutar el servidor
node server.js
El servidor se inicia en http://localhost:3000.

🎮 Cómo jugar
Abre el navegador y ve a http://localhost:3000

Elige un modo de juego: Cyberpunk o Medieval.

Escribe tu nombre y haz clic en “Conectar”.

Espera a que otro jugador se conecte.

Cuando ambos estén listos, pulsa “Iniciar juego”.

Juega por turnos usando las teclas definidas (j para usar carta en esta demo).

⚠️ Notas
No subas node_modules al repositorio.

GitHub no permite archivos de más de 100MB (usa .gitignore y Git LFS si es necesario).

Este proyecto no necesita base de datos aún, pero puedes integrar SQLite más adelante para guardar partidas o usuarios.

📦 Próximamente
Sistema de cartas dinámico

Animaciones y mejoras visuales

Perfil de jugador con estadísticas

Chat entre jugadores

Integración con base de datos SQLite



