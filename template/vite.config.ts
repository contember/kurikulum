import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const target = process.env.KURIKULUM_TARGET || 'standalone';

  return {
    plugins: [
      preact(),
      tailwindcss(),
      viteSingleFile(),
    ],
    define: {
      'import.meta.env.KURIKULUM_TARGET': JSON.stringify(target),
    },
    build: {
      target: 'es2020',
      outDir: `dist/${target}`,
    },
  };
});
