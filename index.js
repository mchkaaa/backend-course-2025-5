const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent'); 

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
    // Спершу пробуємо знайти картинку в кеші
    const imageData = await fs.readFile(imagePath);
    
    // Якщо файл існує в кеші - відправляємо його
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(imageData);
    console.log(`✅ Image for ${httpCode} served from cache`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Файл не знайдено в кеші - пробуємо отримати з http.cat
      await getImageFromHttpCat(req, res, httpCode, imagePath);
    } else {
      throw error;
    }
  }
}

// Функція для обробки PUT запитів
async function handlePutRequest(req, res, httpCode) {
  const imagePath = getImagePath(httpCode);
  
  try {
    // Збираємо дані з тіла запиту
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const imageData = Buffer.concat(chunks);
    
    // Перевіряємо чи є дані
    if (imageData.length === 0) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('No image data provided\n');
    }
    
    // Записуємо файл у кеш
    await fs.writeFile(imagePath, imageData);
    
    // 201 Created для успішного створення/заміни
    res.writeHead(201, { 'Content-Type': 'text/plain' });
    res.end(`Image for HTTP ${httpCode} saved to cache\n`);
    
  } catch (error) {
    throw error;
  }
}
// Функція для обробки DELETE запитів
async function handleDeleteRequest(req, res, httpCode) {
  const imagePath = getImagePath(httpCode);
  
  try {
    // Спроба видалити файл
    await fs.unlink(imagePath);
    
    // 200 OK для успішного видалення
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Image for HTTP ${httpCode} deleted from cache\n`);
    
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