// ─── Métricas de desempeño ────────────────────────────────────────────────────
// A partir de una respuesta completa al escalón (array de valores de `v`, uno
// por paso de tiempo `dt`, empezando en 0) calcula los números clásicos con los
// que se juzga un ajuste de control.

/**
 * @param {number[]} respuesta  valores de v, de t=0 en adelante, separados dt
 * @param {number}   setpoint   valor objetivo
 * @param {number}   dt         paso de tiempo en segundos
 */
export function calcularMetricas(respuesta, setpoint, dt) {
  const n = respuesta.length
  const vFinal = respuesta[n - 1]

  // Error en estado estable: lo que le falta (o le sobra) al final.
  const errorEE = setpoint - vFinal

  // Sobrepaso: cuánto se pasó del objetivo el pico más alto, en %.
  const vPico = Math.max(...respuesta)
  const sobrepaso = vPico > setpoint ? ((vPico - setpoint) / setpoint) * 100 : 0

  // Tiempo de subida: del 10 % al 90 % del setpoint.
  const t10 = primerCruce(respuesta, 0.1 * setpoint, dt)
  const t90 = primerCruce(respuesta, 0.9 * setpoint, dt)
  const alcanzaObjetivo = t90 !== null
  const tSubida = alcanzaObjetivo ? t90 - t10 : null

  // Tiempo de establecimiento: último instante en que la respuesta se sale de
  // la banda de ±2 % alrededor del setpoint. Si al final sigue fuera, no se
  // asienta dentro de la ventana simulada.
  const banda = 0.02 * setpoint
  let tEstablecimiento = 0
  for (let i = 0; i < n; i++) {
    if (Math.abs(respuesta[i] - setpoint) > banda) {
      tEstablecimiento = (i + 1) * dt
    }
  }
  const seAsienta = Math.abs(vFinal - setpoint) <= banda
  if (!seAsienta) tEstablecimiento = null

  return {
    errorEE, // en unidades de v (positivo = se quedó corto)
    sobrepaso, // %
    vPico,
    tSubida, // s, o null si no llega al 90 %
    tEstablecimiento, // s, o null si no se asienta
    banda, // semiancho de la banda de ±2 %, para dibujarla
    alcanzaObjetivo,
  }
}

// Devuelve el instante (s) del primer valor que alcanza `nivel`, o null.
function primerCruce(respuesta, nivel, dt) {
  for (let i = 0; i < respuesta.length; i++) {
    if (respuesta[i] >= nivel) {
      return i * dt
    }
  }
  return null
}
