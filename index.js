const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = 'TU_TOKEN_AQUI';
const CLIENT_ID = 'TU_CLIENT_ID';
const GUILD_ID = 'TU_GUILD_ID';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log(`Bot iniciado como ${client.user.tag}`);
});

client.login(TOKEN);