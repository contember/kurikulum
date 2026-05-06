import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { kurikulum } from 'kurikulum/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [preact(), tailwindcss(), kurikulum()],
  build: { target: 'es2020' },
  // Skip dep pre-bundling for `kurikulum`. Otherwise Vite pre-bundles the root
  // entry but not the `kurikulum/auto` subpath (it pulls in virtual modules),
  // producing two copies of the package — and two distinct CourseContexts —
  // so chrome components throw "useCourse must be used within a CourseProvider".
  optimizeDeps: { exclude: ['kurikulum'] },
})
