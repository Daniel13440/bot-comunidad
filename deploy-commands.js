const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

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
    .setName('setwarnchannel')
    .setDescription('Configura el canal donde se registran los warns')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal para registrar warns')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('setlevelchannel')
    .setDescription('Configura el canal donde se anuncian los niveles')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal para anunciar niveles')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('setlevelrole')
    .setDescription('Asocia o cambia el rol que se da a un nivel')
    .addIntegerOption(option =>
      option.setName('nivel')
        .setDescription('Nivel a configurar')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Rol a asignar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('level')
    .setDescription('Muestra tu nivel y XP actual'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Comandos registrados');
  } catch (error) {
    console.error(error);
  }
})();
