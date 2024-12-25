const { TonClient, Address, beginCell } = require('@ton/ton');
const { WalletV4R2 } = require('@ton/core');

async function executeBuyTransaction(userId, jettonContractAddress, tonAmount, jettonAmount, mnemonics, tokenName, tokenSymbol) {
    try {
        await sendNewMessageAndDeleteLast(
            userId,
            `💫 _Buying ${formatPrice(jettonAmount)} ${tokenSymbol}..._`,
            { parse_mode: 'Markdown' }
        );

        const client = new TonClient({
            endpoint: 'https://mainnet.tonhubapi.com/jsonRPC',
            apiKey: process.env.TON_API_KEY
        });

        const wallet = await WalletV4R2.fromMnemonic(client, mnemonics.split(' '));
        
        const DEDUST_ADDRESS = new Address("EQBfBWT7X2BHm3bvBDXKChKHRQfob_WwXwKAeNrvYPg-zj2n");
        const swapPayload = beginCell().storeUint(0, 32).endCell();

        await wallet.transfer({
            to: DEDUST_ADDRESS,
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
            `✨ Successfully submitted! Buy order for ${formatPrice(jettonAmount)} ${tokenSymbol}.`,
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
