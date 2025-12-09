require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Colors,
    Routes
} = require("discord.js");
const database = require("./database.js");
const {} = require("./commands.js");
const { EmbedBuilder } = require("@discordjs/builders");
const { Client, interceptors } = require("undici-types");
const { dateEqual } = require("@sapphire/shapeshift");
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN is not defined in environment variables.");

const Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

const cooldowns = new Map();
function isOnCooldown(userId, cmd) {
    return cooldowns.has(userId) && cooldowns.get(userId).has(cmd) && cooldowns.get(userId).get(cmd) > Date.now();
}

function setCooldown(userId, cmd, ms) {
    if (!cooldowns.has(userId)) cooldowns.set(userId, new Map());

    cooldowns.get(userId).set(cmd, Date.now() + ms);
}

function getCooldownTime(cmd) {
    const times = {

    };
    return times[cmd] || 5000;
}

const commands = [

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function deployCommands() {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(Client.user.id), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (err) {
        console.log('Error deploying commands:', err);
    }
}

if (Interaction.ischatInputCommand()) {
    const cmd = interaction.commandName;

    const ownerOnly = [];
    if (ownerOnly.includes(cmd) && interaction.user.id !== BOT_OWNER_ID) {
        return interaction.reply({ content: 'This command is restricted to the bot owner.', ephemeral: true });
    }

    const guildOnly = [];
    if (guildOnly.includes(cmd) && !interaction.guild) {
        return interaction.reply({ content: 'This command can only be used in servers.', ephemeral: true });
    }

    if (isOnCooldown(userId, cmd)) {
        const expiresAt = cooldowns.get(userId).get(cmd);
        const timeLeft = Math.ceil((expiresAt - Date.now()) / 1000).toFixed(1);
        return interaction.reply({ content: `Please wait ${timeLeft} more second(s) before using the \`${cmd}\` command again.`, ephemeral: true });
    }
    setCooldown(userId, cmd, getCooldownTime(cmd));

    try {
        switch (cmd) {
            default: 
                return interaction.reply({ content: 'Unknown command.', ephemeral: true });
        }
    } catch (err) {
        console.error('Error executing command:', err);
        return interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
    }
}
