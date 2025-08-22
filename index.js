const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Handle root and index.html
  if (req.url === '/' || req.url === '/index.html' || req.url === '/index') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        console.error('Error reading index.html:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Server Error</h1><p>Could not load the page</p>');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
  // Handle favicon requests
  else if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
  }
  // Handle all other routes - redirect to home
  else {
    console.log(`Redirecting ${req.url} to /`);
    res.writeHead(302, { 'Location': '/' });
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
