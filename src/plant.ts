// ─── La planta ────────────────────────────────────────────────────────────────
// Hay dos plantas para elegir:
//
// PRIMER ORDEN — `dv/dt = (u - v) / tau`
//   Analogía: la velocidad de un motor, o la temperatura de un objeto. La salida
//   se acerca a la entrada poco a poco; nunca oscila por sí sola. `tau` (la
//   "constante de tiempo") decide qué tan rápido responde.
//
// SEGUNDO ORDEN — `d²v/dt² = wn² (u - v) - 2·zeta·wn·(dv/dt)`
//   Analogía: la POSICIÓN de un motor (masa + resorte + fricción). Tiene inercia,
//   así que puede pasarse del objetivo y oscilar aunque la entrada sea constante.
//   `wn` es la frecuencia natural y `zeta` el amortiguamiento (zeta < 1 → oscila).

/** Estado de una planta de primer orden. */
export interface FirstOrderState {
  tipo: 'primer'
  /** Salida medida. */
  v: number
  /** Constante de tiempo en segundos. */
  tau: number
}

/** Estado de una planta de segundo orden. */
export interface SecondOrderState {
  tipo: 'segundo'
  /** Salida medida (piensa: posición). */
  v: number
  /** Derivada de la salida (piensa: velocidad). */
  vdot: number
  /** Frecuencia natural en rad/s. */
  wn: number
  /** Amortiguamiento (zeta < 1 → respuesta oscilatoria). */
  zeta: number
}

/** Una planta es de primer O de segundo orden (unión discriminada por `tipo`). */
export type PlantState = FirstOrderState | SecondOrderState

export function createFirstOrder(tau = 1.5): FirstOrderState {
  return { tipo: 'primer', v: 0, tau }
}

export function createSecondOrder(wn = 2, zeta = 0.3): SecondOrderState {
  return { tipo: 'segundo', v: 0, vdot: 0, wn, zeta }
}

// Mantiene la salida en un rango físico razonable: si una sintonía muy agresiva
// vuelve inestable la simulación, los números no se van a infinito ni a NaN.
const LIMITE = 1e3

/**
 * Avanza la simulación un paso de tiempo `dt`.
 * Devuelve un estado NUEVO (no modifica el que recibe).
 */
export function step(state: PlantState, u: number, dt: number): PlantState {
  if (state.tipo === 'primer') {
    // Euler: nuevo valor = valor actual + velocidad · tiempo.
    const dvdt = (u - state.v) / state.tau
    const v = acotar(state.v + dvdt * dt)
    return { ...state, v }
  }

  // Segundo orden: primero la aceleración, luego integramos dos veces (Euler).
  const acc =
    state.wn * state.wn * (u - state.v) - 2 * state.zeta * state.wn * state.vdot
  const vdot = state.vdot + acc * dt
  const v = acotar(state.v + vdot * dt)
  return { ...state, v, vdot }
}

function acotar(x: number): number {
  return Math.max(-LIMITE, Math.min(LIMITE, x))
}
