import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const types = { '/index.html':'text/html; charset=utf-8', '/style.css':'text/css; charset=utf-8', '/app.mjs':'text/javascript; charset=utf-8', '/calculator.mjs':'text/javascript; charset=utf-8' };
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = path === '/' ? '/index.html' : path;
  if (!types[file]) { response.writeHead(404); response.end('Not found'); return; }
  try { const body = await readFile(new URL(`./site${file}`, import.meta.url)); response.writeHead(200, {'Content-Type':types[file]}); response.end(body); }
  catch { response.writeHead(500); response.end('Could not read calculator file'); }
});
server.on('error', error => { console.error(`Could not start calculator: ${error.message}`); process.exitCode=1; });
server.listen(0, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`Calculator: ${url}\nKeep this window open. Close it to stop the calculator.`);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const browser = spawn('cmd.exe', ['/c','start','',url], {windowsHide:true});
    browser.on('error', () => console.log('Open the address above in your browser.'));
  }
});
