import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const src = resolve(__dirname, 'manifest.json');
      const dest = resolve(__dirname, 'dist', 'manifest.json');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('✓ Copied manifest.json to dist/manifest.json');
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        results: resolve(__dirname, 'results.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
