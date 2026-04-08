import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { searchIndexPlugin } from '../packages/core/src/vite/search-index-plugin.ts'

export default defineConfig(({ mode }) => {
  const target = process.env.KURIKULUM_TARGET || 'standalone'
  const xapiActivityId = process.env.KURIKULUM_XAPI_ACTIVITY_ID || 'https://example.com/courses/default'

  return {
    plugins: [
      preact(),
      tailwindcss(),
      searchIndexPlugin(),
      viteSingleFile(),
    ],
    define: {
      'import.meta.env.KURIKULUM_TARGET': JSON.stringify(target),
      'import.meta.env.KURIKULUM_XAPI_ACTIVITY_ID': JSON.stringify(xapiActivityId),
    },
    build: {
      target: 'es2020',
      outDir: `dist/${target}`,
    },
  }
})
