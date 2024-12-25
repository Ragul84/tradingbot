const { bot, userSessions } = require('../config/bot_config');
const { Image, ImageDraw, ImageFont } = require('jimp');
const { Address } = require('@ton/core');
const { fetch } = require('node-fetch');
const { BytesIO } = require('buffer');

// Position handling
async function handlePosition(userId) {
    try {
        // Clear previous messages
        if (userId in lastMessages && lastMessages[userId]) {
            await deleteMessage(userId, lastMessages[userId].pop());
        }

        // Fetch user positions
        const positions = await fetchUserPositions(userId);

        if (!positions.length) {
            await sendMessageAndRecord(userId, "📊 _You have no position._", { parse_mode: 'Markdown' });
            await handleSkipNow(userId);
            return;
        }

        // Sort positions by buy time
        positions.sort((a, b) => b.buy_time - a.buy_time);

        // Fetch TON to USD rate
        const tonToUsd = await fetchTonPriceUsd();

        // Initialize user session
        userSessions.set(userId, {
            positions: [],
            preferred_platform: null,
            jetton_contract_address: null,
            ton_amount: null,
            sell_amount: null,
            mnemonics: await getUserMnemonic(userId),
            decimals: null,
            price: null,
            symbol: null,
            name: null
        });

        let positionCount = 0;
        let validPositionFound = false;
        const positionMessages = [];

        for (const [index, position] of positions.entries()) {
            if (positionCount >= 10) break;

            const contractAddress = position.contract_address;
            const ownerAddress = await getWalletAddress(userId);

            try {
                const metadata = await fetchMetadata(contractAddress);
                if (!metadata || !validateMetadata(metadata)) continue;

                const jettonInfo = extractJettonInfo(metadata);
                if (jettonInfo.name === 'N/A' && jettonInfo.symbol === 'N/A') continue;

                // Process position data
                const {
                    token_name: tokenName,
                    token_symbol: tokenSymbol,
                    initial_price: initialPrice,
                    amount_received: amountReceived,
                    ton_amount: tonAmount,
                    buy_time: buyTime
                } = position;

                const currentPrice = await fetchCurrentPriceInTon(contractAddress);
                const duration = new Date() - new Date(buyTime);
                const pnl = ((currentPrice - initialPrice) / initialPrice) * 100;

                // Calculate balances and gains
                const balance = await getJettonBalance(ownerAddress, contractAddress);
                if (balance === 0) continue;

                validPositionFound = true;

                // Update position in database
                await updateUserPositionIfNeeded(userId, tokenSymbol, contractAddress, balance, currentPrice);

                // Create message markup
                const markup = {
                    inline_keyboard: [
                        [
                            { text: "Sell 25%", callback_data: `confirm_sell_25_${index}` },
                            { text: "Sell 50%", callback_data: `confirm_sell_50_${index}` },
                            { text: "Sell 100%", callback_data: `confirm_sell_100_${index}` },
                            { text: "Sell X%", callback_data: `confirm_sell_${index}` }
                        ],
                        [
                            { text: "25 TON", callback_data: 'buy_25' },
                            { text: "50 TON", callback_data: 'buy_50' },
                            { text: "100 TON", callback_data: 'buy_100' },
                            { text: "X TON", callback_data: 'buy' }
                        ],
                        [{ text: "🔙 Back", callback_data: 'cancel_transaction' }]
                    ]
                };

                const message = formatPositionMessage(position, currentPrice, pnl, duration);
                const sentMessage = await sendMessageAndRecord(userId, message, { 
                    reply_markup: markup, 
                    parse_mode: 'Markdown' 
                });

                positionMessages.push(sentMessage.message_id);
                positionCount++;

            } catch (error) {
                console.error(`Error processing position for contract ${contractAddress}:`, error);
                continue;
            }
        }

        if (!validPositionFound) {
            await bot.sendMessage(userId, "📊 _You have no position._", { parse_mode: 'Markdown' });
        } else {
            userSessions.get(userId).position_messages = positionMessages;
        }

    } catch (error) {
        console.error("Error in handlePosition:", error);
        await sendMessageAndRecord(userId, "An error occurred while processing your positions. Please try again later.");
    }
}

module.exports = {
    handlePosition
};
