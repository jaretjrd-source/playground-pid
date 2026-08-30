import './style.css'
import { createState, step } from './plant.js'
import { createPid, compute, reset } from './pid.js'
import { createPlot, MAX_PUNTOS } from './plot.js'

// ─── Configuración de la simulación ───────────────────────────────────────────
const DT = 0.03        // paso de tiempo fijo, en segundos
const SETPOINT = 1     // objetivo fijo por ahora (en la Fase 3 se podrá mover)
const TAU = 1.5        // constante de tiempo de la planta

// ─── Elementos del DOM ───────────────────────────────────────────────────────
const canvas = document.querySelector('#grafica')
const btnReiniciar = document.querySelector('#btn-reiniciar')

// ─── Estado ──────────────────────────────────────────────────────────────────
const plot = createPlot(canvas)
let planta = createState(TAU)
const pid = createPid({ Kp: 1.5, Ki: 0.8, Kd: 0.08 })
const historial = []   // valores de `v` que se van dibujando

// ─── Interacción ─────────────────────────────────────────────────────────────
// Conecta un <input range> con su etiqueta numérica y avisa del nuevo valor.
function conectarSlider(idSlider, idValor, alCambiar) {
  const slider = document.querySelector(idSlider)
  const etiqueta = document.querySelector(idValor)
  const refrescar = () => {
    const valor = Number(slider.value)
    etiqueta.textContent = valor.toFixed(2)
    alCambiar(valor)
  }
  slider.addEventListener('input', refrescar)
  refrescar() // aplica el valor inicial al arrancar
}

conectarSlider('#slider-kp', '#valor-kp', (v) => { pid.Kp = v })
conectarSlider('#slider-ki', '#valor-ki', (v) => { pid.Ki = v })
conectarSlider('#slider-kd', '#valor-kd', (v) => { pid.Kd = v })

function reiniciar() {
  planta = createState(TAU)
  reset(pid)
  historial.length = 0
}

btnReiniciar.addEventListener('click', reiniciar)
window.addEventListener('resize', () => plot.resize())

// ─── Bucle principal ─────────────────────────────────────────────────────────
function frame() {
  const error = SETPOINT - planta.v     // 1. cuánto falta para el objetivo
  const u = compute(pid, error, DT)     // 2. el PID decide la entrada
  planta = step(planta, u, DT)          // 3. la planta reacciona un paso

  historial.push(planta.v)              // 4. guardar y acotar el historial
  if (historial.length > MAX_PUNTOS) {
    historial.shift()
  }

  plot.draw(historial, SETPOINT)        // 5. redibujar
  requestAnimationFrame(frame)          // 6. repetir en el próximo cuadro
}

requestAnimationFrame(frame)
