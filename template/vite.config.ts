import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const target = process.env.KURIKULUM_TARGET || 'standalone';
  const xapiActivityId = process.env.KURIKULUM_XAPI_ACTIVITY_ID || 'https://example.com/courses/default';

  return {
    plugins: [
      preact(),
      tailwindcss(),
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
  };
});
