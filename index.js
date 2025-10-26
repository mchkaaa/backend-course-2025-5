const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .name('web-server')
  .description('A simple web server with image caching')
  .version('1.0.0')
  .requiredOption('-h, --host <host>', 'Server host address (required)')
  .requiredOption('-p, --port <port>', 'Server port (required)')
  .requiredOption('-c, --cache <path>', 'Path to cache directory (required)');

program.parse();
const options = program.opts();

// Створюємо cache директорію
const cachePath = path.resolve(options.cache);

async function ensureCacheDirectory() {
  try {
    await fs.mkdir(cachePath, { recursive: true });
    console.log(`✅ Cache directory ready: ${cachePath}`);
  } catch (error) {
    console.error(`❌ Error creating cache directory: ${error.message}`);
    process.exit(1);
  }
}

// Функція для отримання шляху до файлу зображення
function getImagePath(httpCode) {
  return path.join(cachePath, `${httpCode}.jpg`);
}

// Створюємо HTTP сервер
const server = http.createServer(async (req, res) => {
  const urlPath = req.url; // Наприклад: /200, /404, тощо
  const httpCode = urlPath.slice(1); // Видаляємо перший слеш
  
  console.log(`${req.method} request for HTTP code: ${httpCode}`);

  // Перевіряємо чи це числовий HTTP код
  if (!/^\d+$/.test(httpCode)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Invalid HTTP code\n');
  }

  // Обробка різних HTTP методів
  try {
    switch (req.method) {
      case 'GET':
        await handleGetRequest(req, res, httpCode);
        break;
      case 'PUT':
        await handlePutRequest(req, res, httpCode);
        break;
      case 'DELETE':
        await handleDeleteRequest(req, res, httpCode);
        break;
      default:
        // Method Not Allowed для інших методів
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed\n');
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error\n');
  }
});

// Функція для обробки GET запитів
async function handleGetRequest(req, res, httpCode) {
  const imagePath = getImagePath(httpCode);
  
  try {
    // Спроба прочитати файл
    const imageData = await fs.readFile(imagePath);
    
    // Якщо файл існує - відправляємо його
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(imageData);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Файл не знайдено - 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image not found in cache\n');
    } else {
      throw error;
    }
  }
}

// Запускаємо сервер
async function startServer() {
  await ensureCacheDirectory();
  
  server.listen(options.port, options.host, () => {
    console.log(`🚀 Server is running on http://${options.host}:${options.port}`);
    console.log(`💾 Cache directory: ${cachePath}`);
  });
}

startServer().catch(console.error);

// Обробка завершення
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});