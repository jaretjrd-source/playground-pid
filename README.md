# Playground de control PID

App web interactiva para **entender el control PID jugando**: una planta simulada
(la velocidad de un motor, la temperatura de un objeto…) controlada por un
controlador PID, con deslizadores para `Kp`, `Ki`, `Kd`, presets, y una gráfica
en vivo de la respuesta con sus métricas de desempeño.

**Demo:** https://jaretjrd-source.github.io/playground-pid/

![Captura del playground](docs/Playground-PID.png)

## Qué hace

- **Planta de primer orden** `dv/dt = (u - v) / tau` integrada con Euler.
- **Lazo cerrado**: `error = setpoint - v` → PID → entrada `u` → planta → repetir.
- Deslizadores para **Kp, Ki, Kd** y para el **setpoint**, con su valor numérico.
- **Presets**: _Solo P_, _PI_, _PID ajustado_, _Ki muy alto (oscila)_.
- **Métricas** que se recalculan al vuelo: sobrepaso (%), tiempo de subida
  (10–90 %), tiempo de establecimiento (±2 %) y error en estado estable.
- La gráfica marca la **banda de ±2 %** y el **pico de sobrepaso**.
- **Modo oscuro** automático y **`prefers-reduced-motion`** (dibuja la respuesta
  completa en estático en vez de animarla).

## Cómo correrlo

Requiere [Node.js](https://nodejs.org/) 18 o superior.

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # genera dist/ para producción
npm run preview  # sirve dist/ para revisarlo
```

## Estructura

| Archivo           | Responsabilidad                                              |
| ----------------- | ----------------------------------------------------------- |
| `src/plant.js`    | El modelo físico (planta de primer orden).                  |
| `src/pid.js`      | El controlador PID (términos P, I, D y anti-windup).        |
| `src/metrics.js`  | Cálculo de las métricas a partir de la respuesta.           |
| `src/plot.js`     | Dibujo en `<canvas>` (rejilla, setpoint, banda, traza).     |
| `src/main.js`     | Une todo: bucle de simulación, controles y estado.          |

Cada módulo hace una sola cosa; `plant.js`, `pid.js` y `metrics.js` son funciones
puras y se pueden probar sin navegador.

## Qué aprendí

- **Módulos ES**: separar la simulación, el control, las métricas y el dibujo en
  archivos con `export`/`import` en vez de un solo archivo.
- **`requestAnimationFrame`** para animar sincronizado con la pantalla, y un
  `dt` fijo para que la física no dependa de los FPS.
- Dibujar en **`<canvas>`** con `devicePixelRatio` para que se vea nítido, y leer
  colores desde **variables CSS** para que la gráfica siga el tema.
- Funciones de orden superior (pasar un callback a `crearSlider`), estado
  inmutable vs. mutable (la planta devuelve estado nuevo; el PID acumula).
- Accesibilidad básica: `:focus-visible`, `prefers-reduced-motion`,
  `prefers-color-scheme`, `<fieldset>`/`<legend>`.

## Stack

JavaScript puro + [Vite](https://vite.dev/). Sin frameworks.

---

Segundo proyecto de [@jaretjrd-source](https://github.com/jaretjrd-source) ·
[Portafolio](https://jaretjrd-source.github.io/portafolio/)
