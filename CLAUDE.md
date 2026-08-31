# Playground de control PID

App web interactiva: una "planta" (motor / temperatura / posición) controlada por
un PID, con deslizadores para Kp, Ki, Kd y una gráfica en vivo de la respuesta.
Es el **segundo proyecto** de Jaret; su objetivo es **aprender JavaScript moderno**
(y al final un poco de TypeScript). El proyecto es solo el vehículo — lo que
importa es que Jaret entienda cada línea.

Demo de referencia (versión mini, solo para tener el objetivo visual a la vista):
https://claude.ai/code/artifact/fb1aa485-e1fd-4864-a959-1910f846acfe

---

## Sobre Jaret (contexto para cualquier sesión)

- Estudiante de Ingeniería en Mecatrónica en el Tec de Monterrey (campus MTY).
  Se va a un intercambio (DHIK) a Alemania el 15 de septiembre de 2026; este
  portafolio/proyectos le sirven para conseguir las prácticas de ese intercambio.
- **Principiante en desarrollo web y en Git/GitHub.** Explicar los conceptos con
  calma, sin asumir. Ya hizo un juego en Python (Breakout) y su portafolio.
- **Escribe en español → responder en español.**
- Le molesta gastar muchos tokens en tareas largas con muchas herramientas. Ser
  eficiente: no verificar en bucle con navegadores headless, ir al grano.
- Le gusta trabajar **por fases con checklist** (así hizo el portafolio).
- GitHub: `jaretjrd-source` · correo (solo para autoría de Git): jaret.jrd@gmail.com
- Portafolio ya publicado: https://jaretjrd-source.github.io/portafolio/
  (repo `portafolio`, juego en repo `breakout`). Este proyecto se agregará ahí
  como un proyecto más cuando esté listo (Fase 7).

## Cómo trabajar juntos

- Hacer lo que se pueda automáticamente; lo demás, decirle paso a paso qué hacer
  (con clics concretos, no en abstracto).
- Marcar el progreso en este archivo cambiando `[ ]` por `[x]`.
- Commits/push al cerrar cada fase o hito. Si la rama es `main`, crear rama antes
  solo si el usuario lo pide; para este proyecto personal está bien commitear a
  `main` directo. Terminar los mensajes de commit con:
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- Nunca subir datos personales (CV, contratos, identificaciones) al repo.

## Decisiones técnicas

- **JavaScript puro + Vite** (plantilla `vanilla`). Sin framework.
- Simulación en `<canvas>` con `requestAnimationFrame`.
- Código en **módulos ES**: separar la simulación (`plant.js`), el controlador
  (`pid.js`), el dibujo (`plot.js`) y la interfaz (`main.js`).
- Al final (Fase 8) se migra a **TypeScript** — ese es el "poco de TS".
- Deploy en **GitHub Pages** (ojo con `base` en `vite.config.js`).

---

## Progreso general

- [x] Fase 0 — Entorno y proyecto Vite
- [x] Fase 1 — La planta (simulación a lazo abierto)
- [x] Fase 2 — El controlador PID (lazo cerrado)
- [x] Fase 3 — Controles e interacción
- [x] Fase 4 — Métricas de desempeño
- [x] Fase 5 — Pulido visual y UX
- [~] Fase 6 — Calidad de código y README (falta Lighthouse ≥ 90, tras el deploy)
- [ ] Fase 7 — Publicar y enlazar desde el portafolio
- [ ] Fase 8 — Migrar a TypeScript
- [ ] Fase 9 — Extras (opcional)

---

## Fase 0 — Entorno y proyecto Vite

Meta: proyecto Vite corriendo y versionado.

- [x] Confirmar que **Node.js** está instalado (`node -v`, `npm -v`). Si no, instalarlo.
      → Node v24.16.0, npm 11.13.0, git 2.55.0
- [x] En esta carpeta: `npm create vite@latest . -- --template vanilla`
- [x] `npm install`
- [x] `npm run dev` abre la página de ejemplo de Vite en el navegador
- [x] Entender la estructura: `index.html`, `src/main.js`, `src/style.css`, `public/`
- [x] `git init` + primer commit (Vite ya incluye un `.gitignore` con `node_modules/` y `dist/`)
- [x] Crear repo en GitHub llamado `playground-pid` (público, sin README)
- [x] Conectar (`git remote add origin …`) y `git push`
- [x] Borrar el contenido de ejemplo de `main.js`/`style.css` y dejar un "hola" propio

**Fase 0 lista cuando:** `npm run dev` muestra mi página y el repo está en GitHub.

---

## Fase 1 — La planta (simulación a lazo abierto)

Meta: ver un sistema físico respondiendo en una gráfica, sin control todavía.

- [x] `src/plant.js`: modelo de **primer orden** `v_next = v + ((u - v) / tau) * dt`
  con `export function step(state, u, dt)` y un `tau` configurable.
- [x] `src/plot.js`: dibujar en `<canvas>` una traza que se desplaza a la derecha,
  con grid de fondo y una línea horizontal de "objetivo" (setpoint).
- [x] `src/main.js`: bucle con `requestAnimationFrame`, `dt` fijo (~0.03 s),
  guarda el historial de `v` y lo manda a `plot`.
- [x] Un slider que controla `u` directamente (entrada manual) para ver la
  respuesta de la planta sola.
- [x] Manejar `devicePixelRatio` para que el canvas se vea nítido.
- [x] Manejar `resize` de la ventana.

**Fase 1 lista cuando:** muevo el slider de `u` y la curva de la planta reacciona.

---

## Fase 2 — El controlador PID (lazo cerrado)

Meta: que el sistema llegue solo al objetivo.

- [x] `src/pid.js`: `export function compute(pid, error, dt)` que devuelve `u`
  a partir de los términos (las ganancias Kp/Ki/Kd viven dentro de `pid`):
  - P: `Kp * error`
  - I: `Ki * (integral acumulada)` con **anti-windup** (integral recortada a ±5)
  - D: `Kd * (derivada del error)` (0 en el primer paso, sin salto de arranque)
- [x] Conectar el lazo: `error = setpoint - v` → `pid.compute` → `plant.step` → repetir.
- [x] Sliders para **Kp, Ki, Kd** conectados al estado (eventos `input`).
- [x] La gráfica ahora muestra la respuesta a lazo cerrado hacia el setpoint.
- [x] Botón para reiniciar la simulación (v=0, integral=0).

**Fase 2 lista cuando:** con un PID razonable, la curva sube y se estabiliza en el objetivo.

---

## Fase 3 — Controles e interacción

Meta: que se sienta un "playground".

- [x] Control para cambiar el **setpoint** (respuesta al escalón). Botón "nuevo escalón".
- [x] Mostrar el valor numérico actual de cada slider (Kp, Ki, Kd, setpoint).
- [x] Presets: **"Solo P"**, **"PI"**, **"PID ajustado"**, **"Ki muy alto (oscila)"**.
  (El plan decía "Kp muy alto"; con una planta de primer orden solo Kp no oscila
  —queda más rápido y con error—, así que el preset que oscila usa Ki alto.)
- [x] `prefers-reduced-motion`: en lugar de animar, calcular la respuesta completa
  y dibujarla estática; recalcular al mover un slider.
- [x] Estados de foco visibles en todos los controles (`:focus-visible`).

**Fase 3 lista cuando:** puedo experimentar con presets y setpoints y "sentir" el efecto.

---

## Fase 4 — Métricas de desempeño

Meta: números que expliquen qué tan bueno es el ajuste.

- [x] Calcular y mostrar: **sobrepaso (%)**, **tiempo de subida**, **tiempo de
  establecimiento (±2 %)**, **error en estado estable**.
- [x] Marcar en la gráfica: línea del pico de sobrepaso y banda de ±2 % alrededor
  del setpoint.
- [x] Que las métricas se actualicen cuando cambian los parámetros.

**Fase 4 lista cuando:** al ajustar el PID, veo cómo mejoran o empeoran las métricas.

---

## Fase 5 — Pulido visual y UX

Meta: que se vea como algo terminado y de portafolio.

- [x] Variables CSS (`:root`) para colores, tipografía y espaciados.
- [x] Tipografía elegida y jerarquía clara. (Se usa la fuente del sistema a
  propósito: nativa, sin descarga ni salto de maquetación.)
- [x] Modo oscuro (`prefers-color-scheme`) — la gráfica lee sus colores de
  variables CSS (`--plot-*`), así que cambia sola con el tema.
- [x] Layout ordenado. El panel "Objetivo" (setpoint + reiniciar) va al costado
  de la gráfica en pantallas anchas (≥720 px) para no tener que bajar a
  reiniciar; en móvil se apila.
- [x] Textos cortos que expliquen qué hace cada término (P, I, D). (Glosario.)
- [x] Leyenda de la gráfica (traza, setpoint, banda ±2 %, pico).
- [x] `favicon` propio (curva de respuesta al escalón), `<title>` y
  `<meta name="description">`.

**Fase 5 lista cuando:** en una laptop se ve pulido y se entiende sin explicación.

---

## Fase 6 — Calidad de código y README

- [x] Todo en módulos con nombres claros; sin repetir bloques. (Helper
  `reiniciarYActualizar` y `lineaHorizontal` quitan la repetición.)
- [x] Nada de `var`; sin variables globales innecesarias. (Todo vive en el
  scope del módulo `main.js`.)
- [x] Consola del navegador limpia (sin errores ni `console.log` olvidados).
- [x] Código muerto eliminado. `.gitattributes` normaliza los finales de línea.
- [x] `README.md` del repo: qué es, cómo correrlo (`npm install` / `npm run dev`),
  captura o GIF, y qué aprendí. (La captura se añade en la Fase 7 tras el deploy.)
- [ ] Lighthouse (tras el deploy) ≥ 90 en las 4 categorías. → se hace en la Fase 7.

**Fase 6 lista cuando:** otra persona clona el repo, lo corre y entiende el código.

---

## Fase 7 — Publicar y enlazar desde el portafolio

- [x] `vite.config.js`: `base: '/playground-pid/'` (para GitHub Pages en subruta).
- [x] `npm run build` genera `dist/` sin errores.
- [x] Deploy a GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`).
- [x] La URL pública abre y funciona (sin 404 en la consola).
  → https://jaretjrd-source.github.io/playground-pid/
- [ ] Probarla en el teléfono y en otra computadora.
- [ ] Agregar el proyecto al **portafolio** (`../Pagina_web`): nueva tarjeta en
  "Proyectos" con captura, descripción, enlace a la demo y al código (ES + EN).

**Fase 7 lista cuando:** el playground está en línea y enlazado desde el portafolio.

---

## Fase 8 — Migrar a TypeScript

Meta: el "poco de TypeScript".

- [ ] `npm install -D typescript` y crear `tsconfig.json` (o usar plantilla `vanilla-ts`).
- [ ] Renombrar `.js` → `.ts` uno por uno.
- [ ] Tipar: `interface PlantState`, `interface PidState`, `interface PidGains`,
  y los parámetros/retornos de `step` y `compute`.
- [ ] Resolver los errores de tipo que aparezcan (ahí está el aprendizaje).
- [ ] `npm run build` sin errores de TS; la app funciona igual.
- [ ] Anotar en el README qué cambió y qué se sintió distinto.

**Fase 8 lista cuando:** todo el proyecto está en TS y compila limpio.

---

## Fase 9 — Extras (opcional)

- [ ] Planta de **segundo orden** (con oscilación propia) como opción.
- [ ] **Ruido** en la medición + un filtro simple para la parte derivativa.
- [ ] **Perturbaciones**: un botón que "empuja" al sistema y ver cómo el PID lo corrige.
- [ ] Exportar la gráfica como imagen (`canvas.toDataURL`).
- [ ] Comparar dos ajustes lado a lado.

---

## Notas del proyecto

- **Repo de GitHub:** https://github.com/jaretjrd-source/playground-pid
- **URL pública:** https://jaretjrd-source.github.io/playground-pid/
- **Fecha de inicio:** 2026-08-29
