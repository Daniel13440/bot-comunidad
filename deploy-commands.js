const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a expulsar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a banear')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Borra mensajes')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad de mensajes a borrar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Silencia a un usuario (rol Muted necesario)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a silenciar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Quita el silencio a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a desilenciar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Le da una advertencia a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a advertir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón del warn')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Muestra los warns de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a consultar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('level')
    .setDescription('Muestra tu nivel y XP actual'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos globales...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID), // global, sin GUILD_ID
      { body: commands }
    );
    console.log('Comandos globales registrados');
  } catch (error) {
    console.error(error);
  }
})();
