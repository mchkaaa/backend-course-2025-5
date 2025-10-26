// Підключаємо бібліотеку commander
const { Command } = require('commander');
// Створюємо екземпляр програми
const program = new Command();

// Налаштовуємо нашу програму
program
  .name('my-cli-tool') // Назва програми
  .description('A simple CLI tool for my course') // Опис
  .version('1.0.0'); // Версія

// Створюємо свою першу команду
program
  .command('greet <name>') // Назва команди та аргумент (ім'я)
  .description('Greet a user by their name') // Опис команди
  .action((name) => { // Дія, яка виконається при виклику команди
    console.log(`Hello, ${name}!`);
  });

// Парсимо аргументи з командного рядка
program.parse();