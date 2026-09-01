// ─── El controlador PID ───────────────────────────────────────────────────────
// Recibe el "error" (cuánto le falta a la planta para llegar al objetivo) y
// decide qué entrada `u` aplicar. Combina tres términos:
//
//   P (proporcional) → reacciona al error de AHORA.        u_P = Kp · error
//   I (integral)     → reacciona al error ACUMULADO.       u_I = Ki · ∫ error dt
//   D (derivativo)   → reacciona a qué tan rápido CAMBIA.  u_D = Kd · d(error)/dt
//
//   u = u_P + u_I + u_D
//
// Intuición:
//   - Solo P deja un error permanente (nunca llega del todo al objetivo).
//   - I borra ese error permanente, pero de más puede hacer que oscile.
//   - D frena, amortigua las oscilaciones.

// Tope del término integral para evitar el "windup": si la integral pudiera
// crecer sin límite, tras un rato acumularía un valor enorme y la respuesta
// se pasaría muchísimo del objetivo antes de corregirse.
const I_MAX = 5

/** Las tres ganancias del PID. */
export interface PidGains {
  Kp: number
  Ki: number
  Kd: number
}

/** Controlador completo: las ganancias más el estado que arrastra entre pasos. */
export interface PidState extends PidGains {
  /** Suma acumulada de error · dt (término I). */
  integral: number
  /** Error del paso anterior (para el término D). */
  errorPrevio: number
  /** ¿Ya tenemos un `errorPrevio` válido? */
  iniciado: boolean
}

/**
 * Crea el controlador con sus ganancias iniciales.
 */
export function createPid(gains: PidGains): PidState {
  return {
    Kp: gains.Kp,
    Ki: gains.Ki,
    Kd: gains.Kd,
    integral: 0,
    errorPrevio: 0,
    iniciado: false,
  }
}

/**
 * Vuelve el controlador a cero (sin tocar las ganancias Kp/Ki/Kd).
 */
export function reset(pid: PidState): void {
  pid.integral = 0
  pid.errorPrevio = 0
  pid.iniciado = false
}

/**
 * Calcula la entrada `u` para este instante.
 * A diferencia de plant.ts, aquí SÍ modificamos el objeto `pid` directamente,
 * porque el controlador va arrastrando estado (la integral) de un paso al otro.
 * @param pid    controlador creado con createPid
 * @param error  setpoint - valor actual de la planta
 * @param dt     paso de tiempo en segundos
 */
export function compute(pid: PidState, error: number, dt: number): number {
  // ── P ──
  const P = pid.Kp * error

  // ── I ──
  pid.integral += error * dt
  // anti-windup: recortamos la integral al rango [-I_MAX, I_MAX]
  pid.integral = Math.max(-I_MAX, Math.min(I_MAX, pid.integral))
  const I = pid.Ki * pid.integral

  // ── D ──
  // En el primer paso no hay "error anterior" real, así que la derivada es 0
  // (si no, daríamos un salto enorme al arrancar).
  let derivada = 0
  if (pid.iniciado) {
    derivada = (error - pid.errorPrevio) / dt
  }
  const D = pid.Kd * derivada

  // Guardar para el próximo paso.
  pid.errorPrevio = error
  pid.iniciado = true

  return P + I + D
}
