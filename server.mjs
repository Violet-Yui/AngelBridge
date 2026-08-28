import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json; charset=utf-8'};

createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api')) {
    res.writeHead(501, {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'});
    return res.end(JSON.stringify({code:'API_NOT_IMPLEMENTED',message:'前端接口已预留，请由后端服务实现。',path:url.pathname}));
  }
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, safePath);
  try {
    if (!(await stat(filePath)).isFile()) throw new Error('not-file');
  } catch {
    filePath = join(root, 'index.html');
  }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {'Content-Type':mime[extname(filePath).toLowerCase()] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  } catch {
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Not Found');
  }
}).listen(port, '127.0.0.1', () => console.log(`AngelBridge frontend: http://127.0.0.1:${port}/`));
