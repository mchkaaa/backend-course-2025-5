const { Command } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Створюємо екземпляр програми
const program = new Command();

// Налаштовуємо нашу програму
program
  .name('web-server')
  .description('A simple web server with caching')
  .version('1.0.0');

// Додаємо обов'язкові параметри
program
  .requiredOption('-h, --host <host>', 'Server host address (required)')
  .requiredOption('-p, --port <port>', 'Server port (required)')
  .requiredOption('-c, --cache <path>', 'Path to cache directory (required)');

// Парсимо аргументи
program.parse();

// Отримуємо опції
const options = program.opts();

// Крок 2: Створюємо cache директорію, якщо її немає
const cachePath = path.resolve(options.cache);

try {
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
    console.log(`✅ Cache directory created: ${cachePath}`);
  } else {
    console.log(`📁 Cache directory already exists: ${cachePath}`);
  }
} catch (error) {
  console.error(`❌ Error creating cache directory: ${error.message}`);
  process.exit(1);
}

// Крок 3: Створюємо HTTP сервер
const server = http.createServer((req, res) => {
  // Простий відповідь для тестування
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Hello from server! Host: ${options.host}, Port: ${options.port}, Cache: ${cachePath}\n`);
});

// Крок 4: Запускаємо сервер
server.listen(options.port, options.host, () => {
  console.log(`🚀 Server is running on http://${options.host}:${options.port}`);
  console.log(`💾 Cache directory: ${cachePath}`);
});

// Обробка помилок сервера
server.on('error', (error) => {
  console.error(`❌ Server error: ${error.message}`);
});

// Обробка сигналу завершення (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});