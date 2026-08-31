// ─── La gráfica ───────────────────────────────────────────────────────────────
// Dibuja en un <canvas>: una rejilla de fondo, la línea del objetivo (setpoint)
// y la traza de la salida `v` que se desplaza hacia la derecha (lo más nuevo
// siempre queda pegado al borde derecho).

// Rango vertical fijo que se ve en la gráfica.
const Y_MIN = -0.2;
const Y_MAX = 2.2;

// Cuántas muestras caben a lo ancho. También es el tope del historial en main.js.
export const MAX_PUNTOS = 600;

// Colores por defecto, por si una variable CSS no estuviera definida.
const COLOR_POR_DEFECTO = {
  grid: 'rgba(128, 128, 128, 0.25)',
  setpoint: '#e0a020',
  traza: '#2f9e44',
  banda: 'rgba(47, 158, 68, 0.15)',
  pico: '#e8590c',
};

/**
 * Prepara la gráfica sobre un canvas concreto.
 * Devuelve { draw, resize } para usar desde el bucle principal.
 */
export function createPlot(canvas) {
  const ctx = canvas.getContext('2d');

  // Tamaño del canvas en píxeles CSS (no en píxeles físicos).
  let ancho = 0;
  let alto = 0;

  // Lee los colores desde las variables CSS (--plot-*) para que la gráfica siga
  // el tema claro/oscuro sin duplicar valores aquí. Una sola consulta al estilo
  // calculado por dibujo.
  function colores() {
    const estilo = getComputedStyle(canvas);
    const leer = (nombre, fallback) =>
      estilo.getPropertyValue(nombre).trim() || fallback;
    return {
      grid: leer('--plot-grid', COLOR_POR_DEFECTO.grid),
      setpoint: leer('--plot-setpoint', COLOR_POR_DEFECTO.setpoint),
      traza: leer('--plot-traza', COLOR_POR_DEFECTO.traza),
      banda: leer('--plot-banda', COLOR_POR_DEFECTO.banda),
      pico: leer('--plot-pico', COLOR_POR_DEFECTO.pico),
    };
  }

  // Ajusta el canvas a su tamaño en pantalla teniendo en cuenta la densidad de
  // píxeles del monitor (devicePixelRatio) para que se vea nítido, no borroso.
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    ancho = rect.width;
    alto = rect.height;

    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);

    // A partir de aquí dibujamos en coordenadas CSS: 1 unidad = 1 px en pantalla.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Convierte un valor de la planta (eje Y) a una coordenada en píxeles.
  // Y crece hacia abajo en el canvas, por eso restamos.
  function yPix(valor) {
    const t = (valor - Y_MIN) / (Y_MAX - Y_MIN); // 0 abajo … 1 arriba
    return alto - t * alto;
  }

  function lineaHorizontal(valor) {
    const y = yPix(valor);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
    ctx.stroke();
  }

  function dibujarGrid(color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let v = 0; v <= 2; v += 0.5) {
      lineaHorizontal(v);
    }
  }

  // Banda de tolerancia de ±2 % alrededor del setpoint (relleno suave).
  function dibujarBanda(setpoint, semiancho, color) {
    const yArriba = yPix(setpoint + semiancho);
    const yAbajo = yPix(setpoint - semiancho);
    ctx.fillStyle = color;
    ctx.fillRect(0, yArriba, ancho, yAbajo - yArriba);
  }

  function dibujarSetpoint(setpoint, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    lineaHorizontal(setpoint);
    ctx.setLineDash([]);
  }

  // Línea horizontal en el valor del pico de sobrepaso.
  function dibujarPico(valor, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    lineaHorizontal(valor);
    ctx.setLineDash([]);
  }

  function dibujarTraza(historial, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const paso = ancho / (MAX_PUNTOS - 1);
    // Si el historial aún no llena la gráfica, empieza desplazado a la derecha.
    const inicio = MAX_PUNTOS - historial.length;

    historial.forEach((valor, i) => {
      const x = (inicio + i) * paso;
      const y = yPix(valor);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }

  /**
   * Redibuja toda la gráfica.
   * @param {number[]} historial  valores de `v`, del más viejo al más nuevo
   * @param {number}   setpoint   valor objetivo (línea punteada)
   * @param {{banda?: number, pico?: number|null}} [marcas]  adornos opcionales:
   *        `banda` = semiancho de la franja de ±2 %; `pico` = valor del sobrepaso
   */
  function draw(historial, setpoint, marcas = {}) {
    const c = colores();
    ctx.clearRect(0, 0, ancho, alto);
    dibujarGrid(c.grid);
    if (marcas.banda) dibujarBanda(setpoint, marcas.banda, c.banda);
    dibujarSetpoint(setpoint, c.setpoint);
    if (marcas.pico != null) dibujarPico(marcas.pico, c.pico);
    dibujarTraza(historial, c.traza);
  }

  resize(); // medir una vez al crear
  return { draw, resize };
}
