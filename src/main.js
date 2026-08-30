import './style.css'
import { createState, step } from './plant.js'
import { createPid, compute, reset } from './pid.js'
import { createPlot, MAX_PUNTOS } from './plot.js'

// ─── Configuración de la simulación ───────────────────────────────────────────
const DT = 0.03        // paso de tiempo fijo, en segundos
const TAU = 1.5        // constante de tiempo de la planta

// Ganancias predefinidas. Cada preset enseña un comportamiento distinto:
//   p   → solo P: rápido pero deja error permanente (no llega al objetivo)
//   pi  → PI: cierra el error, respuesta suave
//   pid → PID ajustado: rápido y sin sobrepaso
//   osc → Ki muy alto: se pasa del objetivo y oscila antes de asentarse
//         (con esta planta de 1.er orden es la I, no la P, la que hace oscilar)
const PRESETS = {
  p: { Kp: 2, Ki: 0, Kd: 0 },
  pi: { Kp: 1.5, Ki: 1, Kd: 0 },
  pid: { Kp: 3, Ki: 1.5, Kd: 0.25 },
  osc: { Kp: 3, Ki: 10, Kd: 0 },
}

// ¿El sistema operativo pide menos animación? Entonces no animamos: calculamos
// la respuesta completa de una vez y la dibujamos estática.
const prefiereMenosMovimiento =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ─── Estado ──────────────────────────────────────────────────────────────────
const plot = createPlot(document.querySelector('#grafica'))
let planta = createState(TAU)
const pid = createPid(PRESETS.pid)
let setpoint = 1
const historial = []

// ─── Núcleo de la simulación ─────────────────────────────────────────────────
// Un paso del lazo cerrado: error → PID → planta → guardar.
function pasoSimulacion() {
  const error = setpoint - planta.v
  const u = compute(pid, error, DT)
  planta = step(planta, u, DT)

  historial.push(planta.v)
  if (historial.length > MAX_PUNTOS) {
    historial.shift()
  }
}

function reiniciar() {
  planta = createState(TAU)
  reset(pid)
  historial.length = 0
}

// Modo estático: reinicia y corre la simulación entera en un bucle, sin animar.
function recalcularEstatico() {
  reiniciar()
  for (let i = 0; i < MAX_PUNTOS; i++) {
    pasoSimulacion()
  }
  plot.draw(historial, setpoint)
}

// Se llama tras CUALQUIER cambio de parámetro. En modo animado no hace falta
// nada (el bucle ya usa los valores nuevos); en modo estático hay que redibujar.
function alCambiarParametro() {
  if (prefiereMenosMovimiento) {
    recalcularEstatico()
  }
}

// ─── Controles ───────────────────────────────────────────────────────────────
// Conecta un <input range> con su etiqueta numérica y con el estado.
// Devuelve un objeto con `set(valor)` para moverlo desde código (presets, etc.).
function crearSlider(idSlider, idValor, aplicar) {
  const slider = document.querySelector(idSlider)
  const etiqueta = document.querySelector(idValor)

  function sincronizar() {
    const valor = Number(slider.value)
    etiqueta.textContent = valor.toFixed(2)
    aplicar(valor)
  }

  slider.addEventListener('input', () => {
    sincronizar()
    alCambiarParametro()
  })

  sincronizar() // aplica el valor inicial del HTML (sin recalcular todavía)

  return {
    set(valor) {
      slider.value = valor
      sincronizar()
    },
  }
}

const sliderKp = crearSlider('#slider-kp', '#valor-kp', (v) => { pid.Kp = v })
const sliderKi = crearSlider('#slider-ki', '#valor-ki', (v) => { pid.Ki = v })
const sliderKd = crearSlider('#slider-kd', '#valor-kd', (v) => { pid.Kd = v })
const sliderSp = crearSlider('#slider-sp', '#valor-sp', (v) => { setpoint = v })

function aplicarPreset(nombre) {
  const g = PRESETS[nombre]
  sliderKp.set(g.Kp)
  sliderKi.set(g.Ki)
  sliderKd.set(g.Kd)
  reiniciar()
  alCambiarParametro()
}

function nuevoEscalon() {
  const aleatorio = 0.3 + Math.random() * 1.2 // entre 0.3 y 1.5
  sliderSp.set(Math.round(aleatorio / 0.05) * 0.05)
  reiniciar()
  alCambiarParametro()
}

document.querySelectorAll('[data-preset]').forEach((boton) => {
  boton.addEventListener('click', () => aplicarPreset(boton.dataset.preset))
})
document.querySelector('#btn-escalon').addEventListener('click', nuevoEscalon)
document.querySelector('#btn-reiniciar').addEventListener('click', () => {
  reiniciar()
  alCambiarParametro()
})
window.addEventListener('resize', () => {
  plot.resize()
  if (prefiereMenosMovimiento) {
    plot.draw(historial, setpoint)
  }
})

// ─── Arranque ────────────────────────────────────────────────────────────────
if (prefiereMenosMovimiento) {
  recalcularEstatico()
} else {
  const frame = () => {
    pasoSimulacion()
    plot.draw(historial, setpoint)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
