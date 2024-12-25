require('dotenv').config();
const { initializeBot } = require('./config/bot_config');
const { handlePosition } = require('./handlers/position_handlers');
const { OrderMonitor } = require('./services/monitoring');

(async function startBot() {
    let bot;
    try {
        bot = initializeBot();
        const monitor = new OrderMonitor();
        
        // Initialize monitoring
        await monitor.initialize();
        await monitor.restartMonitoring();

        // Handle bot shutdown
        process.on('SIGINT', async () => {
            await monitor.stopMonitoring();
            bot.stopPolling();
            process.exit(0);
        });

        // Error handling for polling
        bot.on('polling_error', (error) => {
            if (error.code === 'ETELEGRAM') {
                console.log('Polling error occurred, restarting bot...');
                bot.stopPolling();
                setTimeout(() => {
                    bot.startPolling();
                }, 5000);
            } else {
                console.error('Bot error:', error);
            }
        });

    } catch (error) {
        console.error('Error initializing bot:', error);
        process.exit(1);
    }
})();
