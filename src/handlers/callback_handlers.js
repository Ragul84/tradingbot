const { bot, userSessions } = require('../config/bot_config');
const { executeBuyTransaction } = require('../services/dedust_transactions');
const { executeBuyTransactionStonfi } = require('../services/stonfi_transactions');
const { getUserMnemonic, sendMessageAndRecord, handleSkipNow } = require('../utils/bot_utils');
const { formatPrice } = require('../utils/format_utils');

// Buy confirmation handler
bot.on('callback_query', async (callbackQuery) => {
    if (callbackQuery.data !== 'confirm_buy') return;
    
    const userId = callbackQuery.message.chat.id;
    const session = userSessions.get(userId);

    if (!session) {
        await sendMessageAndRecord(userId, "✨ Session expired. Please start a new transaction.");
        await handleSkipNow(userId);
        return;
    }

    const {
        preferred_platform: preferredPlatform = 'DeDust',
        jetton_contract_address: jettonContractAddress,
        ton_amount: tonAmount,
        jetton_amount: jettonAmount,
        name: tokenName,
        symbol: tokenSymbol
    } = session;

    const mnemonics = await getUserMnemonic(userId);

    try {
        if (preferredPlatform === 'DeDust') {
            await executeBuyTransaction(
                userId,
                jettonContractAddress,
                tonAmount,
                jettonAmount,
                mnemonics,
                tokenName,
                tokenSymbol
            );
        } else if (preferredPlatform === 'StonFi') {
            await executeBuyTransactionStonfi(
                userId,
                jettonContractAddress,
                tonAmount,
                jettonAmount,
                mnemonics,
                tokenName,
                tokenSymbol
            );
        }
    } catch (error) {
        await sendMessageAndRecord(userId, `Error executing transaction: ${error.message}`);
        await handleSkipNow(userId);
    }
});

// Sell confirmation handler
bot.on('callback_query', async (callbackQuery) => {
    if (callbackQuery.data !== 'confirm_sell') return;
    
    const userId = callbackQuery.message.chat.id;
    const session = userSessions.get(userId);

    if (!session) {
        await sendMessageAndRecord(userId, "✨ Session expired. Please start a new transaction.");
        await handleSkipNow(userId);
        return;
    }

    const {
        preferred_platform: preferredPlatform = 'DeDust',
        jetton_contract_address: jettonContractAddress,
        ton_amount: tonAmount,
        sell_amount: sellAmount,
        name: tokenName,
        symbol: tokenSymbol,
        decimals
    } = session;

    const mnemonics = await getUserMnemonic(userId);

    try {
        if (preferredPlatform === 'DeDust') {
            await executeSellTransaction(
                userId,
                jettonContractAddress,
                tonAmount,
                sellAmount,
                mnemonics,
                decimals,
                tokenName,
                tokenSymbol
            );
        } else if (preferredPlatform === 'StonFi') {
            await executeSellTransactionStonfi(
                userId,
                jettonContractAddress,
                tonAmount,
                sellAmount,
                mnemonics,
                decimals,
                tokenName,
                tokenSymbol
            );
        }
    } catch (error) {
        await sendMessageAndRecord(userId, `Error executing transaction: ${error.message}`);
        await handleSkipNow(userId);
    }
});

// Cancel transaction handler
bot.on('callback_query', async (callbackQuery) => {
    if (callbackQuery.data !== 'cancel_transaction') return;
    
    const userId = callbackQuery.message.chat.id;
    userSessions.delete(userId);
    await sendMessageAndRecord(userId, "Transaction cancelled.");
    await handleSkipNow(userId);
});

module.exports = {
    // Export any functions that might be needed elsewhere
};

