import './style.css'
import { createState, step } from './plant.js'
import { createPid, compute, reset } from './pid.js'
import { createPlot, MAX_PUNTOS } from './plot.js'
import { calcularMetricas } from './metrics.js'

// ─── Configuración de la simulación ───────────────────────────────────────────
const DT = 0.03            // paso de tiempo fijo, en segundos
const TAU = 1.5            // constante de tiempo de la planta
const VENTANA = MAX_PUNTOS * DT // segundos que abarca la gráfica

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
let marcas = {} // { banda, pico } para dibujar en la gráfica; lo pone alCambiarParametro()

// ─── Núcleo de la simulación ─────────────────────────────────────────────────
// Un paso del lazo cerrado sobre un estado dado. `compute` modifica el
// controlador; `step` devuelve un estado de planta nuevo.
function avanzar(estadoPlanta, controlador) {
  const error = setpoint - estadoPlanta.v
  const u = compute(controlador, error, DT)
  return step(estadoPlanta, u, DT)
}

// Avanza la simulación "en vivo" un paso y la guarda en el historial rodante.
function pasoSimulacion() {
  planta = avanzar(planta, pid)
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

// Corre una respuesta al escalón COMPLETA y fresca (desde v=0, integral=0) con
// las ganancias actuales, sin tocar el estado en vivo. Sirve para las métricas
// y para el dibujo estático.
function simularRespuesta() {
  let p = createState(TAU)
  const c = createPid(pid) // copia Kp/Ki/Kd; su integral arranca en 0
  const salida = []
  for (let i = 0; i < MAX_PUNTOS; i++) {
    p = avanzar(p, c)
    salida.push(p.v)
  }
  return salida
}

// ─── Métricas ────────────────────────────────────────────────────────────────
const celdas = {
  sobrepaso: document.querySelector('#m-sobrepaso'),
  subida: document.querySelector('#m-subida'),
  establecimiento: document.querySelector('#m-establecimiento'),
  error: document.querySelector('#m-error'),
}

function mostrarMetricas(metricas) {
  celdas.sobrepaso.textContent = metricas.alcanzaObjetivo
    ? `${metricas.sobrepaso.toFixed(1)} %`
    : '—'
  celdas.subida.textContent =
    metricas.tSubida != null ? `${metricas.tSubida.toFixed(2)} s` : '—'
  celdas.establecimiento.textContent =
    metricas.tEstablecimiento != null
      ? `${metricas.tEstablecimiento.toFixed(2)} s`
      : `> ${VENTANA.toFixed(0)} s`
  const pct = (metricas.errorEE / setpoint) * 100
  celdas.error.textContent =
    `${metricas.errorEE.toFixed(3)} (${pct.toFixed(1)} %)`
}

// Se llama tras CUALQUIER cambio de parámetro: recalcula las métricas y las
// marcas de la gráfica y, en modo estático, redibuja la respuesta completa.
function alCambiarParametro() {
  const respuesta = simularRespuesta()
  const metricas = calcularMetricas(respuesta, setpoint, DT)
  mostrarMetricas(metricas)
  marcas = {
    banda: metricas.banda,
    pico: metricas.sobrepaso > 0 ? metricas.vPico : null,
  }

  if (prefiereMenosMovimiento) {
    reiniciar()
    historial.push(...respuesta)
    plot.draw(historial, setpoint, marcas)
  }
}

// Reinicia la simulación y refresca métricas/dibujo. Se usa tras un preset, un
// nuevo escalón o el botón de reiniciar.
function reiniciarYActualizar() {
  reiniciar()
  alCambiarParametro()
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
  reiniciarYActualizar()
}

function nuevoEscalon() {
  const aleatorio = 0.3 + Math.random() * 1.2 // entre 0.3 y 1.5
  sliderSp.set(Math.round(aleatorio / 0.05) * 0.05)
  reiniciarYActualizar()
}

document.querySelectorAll('[data-preset]').forEach((boton) => {
  boton.addEventListener('click', () => aplicarPreset(boton.dataset.preset))
})
document.querySelector('#btn-escalon').addEventListener('click', nuevoEscalon)
document.querySelector('#btn-reiniciar').addEventListener('click', reiniciarYActualizar)
window.addEventListener('resize', () => {
  plot.resize()
  if (prefiereMenosMovimiento) {
    plot.draw(historial, setpoint, marcas)
  }
})

// ─── Arranque ────────────────────────────────────────────────────────────────
alCambiarParametro() // primera métrica (y primer dibujo si es estático)

if (!prefiereMenosMovimiento) {
  const frame = () => {
    pasoSimulacion()
    plot.draw(historial, setpoint, marcas)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
