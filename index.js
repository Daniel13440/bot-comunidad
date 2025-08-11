const { Client, GatewayIntentBits, PermissionsBitField, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1404308965185159380";  // Poné tu Client ID fijo
const GUILD_ID = "1404308965185159380";   // Poné tu Guild ID fijo

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let warnChannelId = null;
let levelChannelId = null;

let warns = {};
let xpData = {};

let levelRoles = [
    { level: 1, roleName: "Bronce" },
    { level: 5, roleName: "Plata" },
    { level: 10, roleName: "Oro" }
];

// Cargar datos si existen
if (fs.existsSync('./warns.json')) warns = JSON.parse(fs.readFileSync('./warns.json'));
if (fs.existsSync('./xp.json')) xpData = JSON.parse(fs.readFileSync('./xp.json'));
if (fs.existsSync('./config.json')) {
    const config = JSON.parse(fs.readFileSync('./config.json'));
    warnChannelId = config.warnChannelId || null;
    levelChannelId = config.levelChannelId || null;
    levelRoles = config.levelRoles || levelRoles;
}

function saveData() {
    fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2));
    fs.writeFileSync('./xp.json', JSON.stringify(xpData, null, 2));
    fs.writeFileSync('./config.json', JSON.stringify({ warnChannelId, levelChannelId, levelRoles }, null, 2));
}

const commands = [
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true)),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banea a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true)),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Borra mensajes')
        .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad de mensajes').setRequired(true)),

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silencia a un usuario (rol Muted necesario)')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a silenciar').setRequired(true)),

    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Quita el silencio a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a desilenciar').setRequired(true)),

    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Le da una advertencia a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razón del warn').setRequired(true)),

    new SlashCommandBuilder()
        .setName('warns')
        .setDescription('Muestra los warns de un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar').setRequired(true)),

    new SlashCommandBuilder()
        .setName('setwarnchannel')
        .setDescription('Configura el canal donde se registran los warns')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal para registrar warns').setRequired(true)),

    new SlashCommandBuilder()
        .setName('setlevelchannel')
        .setDescription('Configura el canal donde se anuncian los niveles')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal para anunciar niveles').setRequired(true)),

    new SlashCommandBuilder()
        .setName('setlevelrole')
        .setDescription('Asocia o cambia el rol que se da a un nivel')
        .addIntegerOption(opt => opt.setName('nivel').setDescription('Nivel a configurar').setRequired(true))
        .addRoleOption(opt => opt.setName('rol').setDescription('Rol a asignar').setRequired(true)),

    new SlashCommandBuilder()
        .setName('level')
        .setDescription('Muestra tu nivel y XP actual'),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log('Registrando comandos...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Comandos registrados');
    } catch (e) {
        console.error(e);
    }
})();

client.once('ready', () => {
    console.log(`Bot iniciado: ${client.user.tag}`);
});

function getLevel(xp) {
    let level = Math.floor(Math.sqrt(xp / 10));
    if (level > 1e15) level = 1e15;
    return level;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    if (!xpData[userId]) xpData[userId] = 0;

    const oldLevel = getLevel(xpData[userId]);

    xpData[userId] += 5;

    const newLevel = getLevel(xpData[userId]);

    saveData();

    if (newLevel > oldLevel) {
        if (levelChannelId) {
            const channel = message.guild.channels.cache.get(levelChannelId);
            if (channel) {
                channel.send(`🎉 **${message.author.tag}** subió a nivel **${newLevel}**!`);
            }
        }

        const guildMember = await message.guild.members.fetch(userId);

        const rolesToHave = levelRoles.filter(r => newLevel >= r.level).map(r => r.roleName);

        for (const roleName of rolesToHave) {
            const role = message.guild.roles.cache.find(r => r.name === roleName);
            if (role && !guildMember.roles.cache.has(role.id)) {
                await guildMember.roles.add(role);
            }
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setwarnchannel') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'No tenés permiso para usar este comando.', ephemeral: true });
        }
        const channel = interaction.options.getChannel('canal');
        if (!channel || channel.type !== 0) {
            return interaction.reply({ content: 'Elegí un canal de texto válido.', ephemeral: true });
        }
        warnChannelId = channel.id;
        saveData();
        return interaction.reply(`Canal de warns configurado a ${channel.toString()}`);
    }

    else if (commandName === 'setlevelchannel') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'No tenés permiso para usar este comando.', ephemeral: true });
        }
        const channel = interaction.options.getChannel('canal');
        if (!channel || channel.type !== 0) {
            return interaction.reply({ content: 'Elegí un canal de texto válido.', ephemeral: true });
        }
        levelChannelId = channel.id;
        saveData();
        return interaction.reply(`Canal de niveles configurado a ${channel.toString()}`);
    }

    else if (commandName === 'setlevelrole') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'No tenés permiso para usar este comando.', ephemeral: true });
        }
        const level = interaction.options.getInteger('nivel');
        const role = interaction.options.getRole('rol');
        const existing = levelRoles.find(r => r.level === level);
        if (existing) existing.roleName = role.name;
        else levelRoles.push({ level, roleName: role.name });
        levelRoles.sort((a, b) => a.level - b.level);
        saveData();
        return interaction.reply(`Nivel ${level} ahora asigna el rol ${role.name}`);
    }

    else if (commandName === 'warn') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: 'No tenés permiso para advertir.', ephemeral: true });
        }
        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon');
        if (!warns[user.id]) warns[user.id] = [];
        warns[user.id].push(reason);
        saveData();
        interaction.reply(`${user.tag} fue advertido por: ${reason}. Total warns: ${warns[user.id].length}`);
        if (warnChannelId) {
            const channel = interaction.guild.channels.cache.get(warnChannelId);
            if (channel) channel.send(`⚠️ **${user.tag}** fue warneado por: ${reason}`);
        }
    }

    else if (commandName === 'warns') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: 'No tenés permiso para ver advertencias.', ephemeral: true });
        }
        const user = interaction.options.getUser('usuario');
        const userWarns = warns[user.id] || [];
        if (userWarns.length === 0) return interaction.reply({ content: `${user.tag} no tiene advertencias.`, ephemeral: true });
        interaction.reply({ content: `Advertencias de ${user.tag}:\n${userWarns.map((r, i) => `${i + 1}. ${r}`).join('\n')}`, ephemeral: true });
    }

    else if (commandName === 'kick') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: 'No tenés permiso para expulsar.', ephemeral: true });
        }
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id);
        await member.kick();
        interaction.reply(`${user.tag} fue expulsado.`);
    }

    else if (commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'No tenés permiso para banear.', ephemeral: true });
        }
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id);
        await member.ban();
        interaction.reply(`${user.tag} fue baneado.`);
    }

    else if (commandName === 'clear') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'No tenés permiso para borrar mensajes.', ephemeral: true });
        }
        const amount = interaction.options.getInteger('cantidad');
        await interaction.channel.bulkDelete(amount, true);
        interaction.reply(`${amount} mensajes borrados.`);
    }

    else if (commandName === 'mute') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'No tenés permiso para silenciar.', ephemeral: true });
        }
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id);
        const muteRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        if (!muteRole) return interaction.reply({ content: 'No encontré el rol "Muted". Crealo primero.', ephemeral: true });
        if (member.roles.cache.has(muteRole.id)) return interaction.reply({ content: 'El usuario ya está silenciado.', ephemeral: true });
        await member.roles.add(muteRole);
        interaction.reply(`${user.tag} fue silenciado.`);
    }

    else if (commandName === 'unmute') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return interaction.reply({ content: 'No tenés permiso para desilenciar.', ephemeral: true });
        }
        const user = interaction.options.getUser('usuario');
        const member = await interaction.guild.members.fetch(user.id);
        const muteRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        if (!muteRole) return interaction.reply({ content: 'No encontré el rol "Muted". Crealo primero.', ephemeral: true });
        if (!member.roles.cache.has(muteRole.id)) return interaction.reply({ content: 'El usuario no está silenciado.', ephemeral: true });
        await member.roles.remove(muteRole);
        interaction.reply(`${user.tag} fue desilenciado.`);
    }

    else if (commandName === 'level') {
        const userId = interaction.user.id;
        const xp = xpData[userId] || 0;
        const level = getLevel(xp);
        interaction.reply(`${interaction.user.tag}, tenés nivel ${level} con ${xp} XP.`);
    }
});

client.login(TOKEN);
