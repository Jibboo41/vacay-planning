import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Isolated browser fixture: all Firebase traffic is replaced by local test data.
// This configuration is never used by the production build.
const firebase = fileURLToPath(new URL('./previewFirebase.ts', import.meta.url));
export default defineConfig({
  plugins: [react(), {
    name: 'preview-routes',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (/^\/(timeline|map|summary|todo|costs|weather|notes|packing|cards|trips|debug|login)?(?:\?.*)?$/.test(request.url || '')) request.url = '/tests/preview.html';
        next();
      });
    },
  }],
  resolve: { alias: [
    { find: /^(?:\.\.?\/)+core\/firebase$/, replacement: firebase },
    { find: /^(?:\.\.?\/)+core\/timelineDetails$/, replacement: fileURLToPath(new URL('./previewTimelineDetails.ts', import.meta.url)) },
    { find: /^firebase\/(auth|firestore|storage)$/, replacement: firebase },
  ] },
  server: { host: '127.0.0.1', port: 5174 },
});
