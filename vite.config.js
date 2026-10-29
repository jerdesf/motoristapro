import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function localApiPlugin() {
  return {
    name: 'local-api-handler',
    configureServer(server) {
      server.middlewares.use('/api/data', (req, res) => {
        const dataDir = path.resolve(process.cwd(), 'data');
        const dataFile = path.join(dataDir, 'motoristapro.json');

        if (req.method === 'GET') {
          if (fs.existsSync(dataFile)) {
            try {
              const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ source: 'local_file', data }));
              return;
            } catch (e) {}
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ source: 'none', data: null }));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
              fs.writeFileSync(dataFile, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, savedToLocalFile: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to write file' }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
