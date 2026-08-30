import './style.css'
import { createState, step } from './plant.js'
import { createPlot, MAX_PUNTOS } from './plot.js'

// ─── Configuración de la simulación ───────────────────────────────────────────
const DT = 0.03        // paso de tiempo fijo, en segundos
const SETPOINT = 1     // objetivo fijo por ahora (en la Fase 2 se podrá mover)
const TAU = 1.5        // constante de tiempo de la planta

// ─── Elementos del DOM ───────────────────────────────────────────────────────
const canvas = document.querySelector('#grafica')
const sliderU = document.querySelector('#slider-u')
const valorU = document.querySelector('#valor-u')

// ─── Estado ──────────────────────────────────────────────────────────────────
const plot = createPlot(canvas)
let planta = createState(TAU)
let u = Number(sliderU.value)      // entrada manual, la controla el slider
const historial = []               // valores de `v` que se van dibujando

// ─── Interacción ─────────────────────────────────────────────────────────────
sliderU.addEventListener('input', () => {
  u = Number(sliderU.value)
  valorU.textContent = u.toFixed(2)
})

window.addEventListener('resize', () => plot.resize())

// ─── Bucle principal ─────────────────────────────────────────────────────────
function frame() {
  planta = step(planta, u, DT)        // 1. avanzar la física un paso
  historial.push(planta.v)            // 2. guardar la salida
  if (historial.length > MAX_PUNTOS) {
    historial.shift()                 //    tirar la muestra más vieja
  }
  plot.draw(historial, SETPOINT)      // 3. redibujar
  requestAnimationFrame(frame)        // 4. repetir en el próximo cuadro
}

valorU.textContent = u.toFixed(2)
requestAnimationFrame(frame)
