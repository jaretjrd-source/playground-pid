// ─── La planta ────────────────────────────────────────────────────────────────
// Modelo de PRIMER ORDEN.
//
// Analogía: un vaso de agua que quieres calentar. `u` es la entrada que aplicas
// (imagina la temperatura del calentador) y `v` es la salida que mides (la
// temperatura del agua). El agua no salta de golpe a `u`: se le acerca poco a
// poco. Qué tan rápido lo hace lo decide `tau` (la "constante de tiempo"):
//   - tau grande  → la planta responde lento
//   - tau pequeño → la planta responde rápido
//
// La ecuación es:  dv/dt = (u - v) / tau
// es decir: "la salida cambia más rápido cuanto más lejos está de la entrada".

/** Estado de la planta en un instante. */
export interface PlantState {
  /** Salida medida (lo que perseguimos hacia el setpoint). */
  v: number;
  /** Constante de tiempo en segundos. */
  tau: number;
}

/**
 * Crea el estado inicial de la planta.
 * @param tau  constante de tiempo en segundos
 */
export function createState(tau = 1): PlantState {
  return { v: 0, tau };
}

/**
 * Avanza la simulación un paso de tiempo `dt`.
 * Devuelve un estado NUEVO (no modifica el que recibe).
 * @param state  estado actual
 * @param u      entrada aplicada ahora
 * @param dt     paso de tiempo en segundos
 */
export function step(state: PlantState, u: number, dt: number): PlantState {
  // Velocidad de cambio de la salida en este instante.
  const dvdt = (u - state.v) / state.tau;

  // Integración de Euler: nuevo valor = valor actual + velocidad · tiempo.
  const v = state.v + dvdt * dt;

  return { ...state, v };
}
