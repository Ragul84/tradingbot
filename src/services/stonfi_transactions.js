const { TonClient, Address, beginCell } = require('@ton/ton');
const { WalletV4R2 } = require('@ton/core');

async function executeBuyTransactionStonfi(userId, jettonContractAddress, tonAmount, jettonAmount, mnemonics, tokenName, tokenSymbol) {
    try {
        await sendNewMessageAndDeleteLast(
            userId,
            `💫 _Buying ${formatPrice(jettonAmount)} ${tokenSymbol} via StonFi..._`,
            { parse_mode: 'Markdown' }
        );

        const client = new TonClient({
            endpoint: 'https://mainnet.tonhubapi.com/jsonRPC',
            apiKey: process.env.TON_API_KEY
        });

        const wallet = await WalletV4R2.fromMnemonic(client, mnemonics.split(' '));
        
        const STONFI_ADDRESS = new Address("EQDQoc5M3Bh8eWFephi9bClhevelbZZvWhkqdo80XuY_0qXv");
        const swapPayload = beginCell().storeUint(1, 32).endCell();

        await wallet.transfer({
            to: STONFI_ADDRESS,
            amount: BigInt(Math.floor(tonAmount * 1e9)),
            body: swapPayload
        });

        const markup = {
            inline_keyboard: [[
                { text: "✅ Done", callback_data: 'cancel_transaction' }
            ]]
        };

        await sendMessageAndRecord(
            userId,
            `✨ Successfully submitted! Buy order for ${formatPrice(jettonAmount)} ${tokenSymbol} via StonFi.`,
            { reply_markup: markup, parse_mode: 'Markdown' }
        );

        userSessions.delete(userId);
        await handleSkipNowNow(userId);

    } catch (error) {
        await sendMessageAndRecord(
            userId,
            `✨ Transaction could not be completed: \`\`\`${error.message}\`\`\``,
            { parse_mode: 'Markdown' }
        );
        userSessions.delete(userId);
        await handleSkipNowNow(userId);
    }
}

module.exports = {
    executeBuyTransactionStonfi
};
