const TelegramBot = require('node-telegram-bot-api');

const initializeBot = () => {
    const bot = new TelegramBot(process.env.BOT_TOKEN, {
        polling: true
    });
    
    // Add any initial bot configurations here
    bot.setMyCommands([
        { command: '/start', description: 'Start the bot' },
        { command: '/help', description: 'Show help information' },
        { command: '/buy', description: 'Buy tokens' },
        { command: '/sell', description: 'Sell tokens' }
    ]);

    return bot;
};

module.exports = {
    initializeBot
};
