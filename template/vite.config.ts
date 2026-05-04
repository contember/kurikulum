import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { kurikulum } from 'kurikulum/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [preact(), tailwindcss(), kurikulum()],
  build: { target: 'es2020' },
})
