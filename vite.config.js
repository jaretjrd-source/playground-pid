import { defineConfig } from 'vite'

// GitHub Pages sirve el sitio en https://<usuario>.github.io/playground-pid/,
// es decir bajo una subruta, no en la raíz del dominio. `base` le dice a Vite
// que anteponga esa subruta a las rutas de los assets al hacer `build`.
// En `npm run dev` Vite ignora `base` y sirve en la raíz, así que no molesta.
export default defineConfig({
  base: '/playground-pid/',
})
