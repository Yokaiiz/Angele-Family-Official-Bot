require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    SlashCommandBuilder,
    Routes
} = require("discord.js");

const database = require("./database.js");
const { handlePingCommand, handleAddRoleCommand, handleRemoveRoleCommand, handleBanCommand, handleKickCommand, handleMuteCommand, handleLockDownChannelCommand } = require("./commands.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const BOT_OWNER_ID = process.env.BOT_OWNER_ID;

if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN is missing in .env!");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel]
});

// ------------------------------
// Slash commands
// ------------------------------
const commands = [
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with your mention."),
    new SlashCommandBuilder().setName('add_role').setDescription('Adds a role to a member')
        .addUserOption(option => option.setName('member').setDescription('The member you wish to add the role to.').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('the role you wish to add.').setRequired(true)),
    new SlashCommandBuilder().setName('remove_role').setDescription('Removes a role from a member.')
        .addUserOption(option => option.setName('member').setDescription('The member you wish to add the role to.').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('the role you wish to add to the member.').setRequired(true)),
    new SlashCommandBuilder().setName('ban').setDescription('Bans a member from the server.')
        .addUserOption(option => option.setName('member').setDescription('The member you wish to ban.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the ban.').setRequired(false)),
    new SlashCommandBuilder().setName('kick').setDescription('Kicks a member from the server.')
        .addUserOption(option => option.setName('member').setDescription('The member you wish to kick.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the kick.').setRequired(false)),
    new SlashCommandBuilder().setName('mute').setDescription('Mutes a member in the server.')
        .addUserOption(option => option.setName('member').setDescription('The member you wish to mute.').setRequired(true))
        .addIntegerOption(option => option.setName('duration').setDescription('Duration of the mute in minutes.').setRequired(true)),
    new SlashCommandBuilder().setName('lockdown').setDescription('locks down a channel.')
        .addChannelOption(option => option.setName('channel').setDescription('The channel you wish to lockdown.').setRequired(false)),
    new SlashCommandBuilder().setName('unlock').setDescription('unlocks a channel.')
        .addChannelOption(option => option.setName('channel').setDescription('The channel you wish to unlock.').setRequired(false)),
].map(c => c.toJSON());

// REST for slash command deployment
const rest = new REST({ version: "10" }).setToken(TOKEN);

async function deployCommands() {
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log("✔ Successfully reloaded application commands.");
    } catch (err) {
        console.error(err);
    }
}

// ------------------------------
// Cooldowns
// ------------------------------
const cooldowns = new Map();

function isOnCooldown(userId, cmd) {
    return cooldowns.has(userId)
        && cooldowns.get(userId).has(cmd)
        && cooldowns.get(userId).get(cmd) > Date.now();
}

function setCooldown(userId, cmd, ms) {
    if (!cooldowns.has(userId)) cooldowns.set(userId, new Map());
    cooldowns.get(userId).set(cmd, Date.now() + ms);
}

// ------------------------------
// Interaction handler
// ------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction || !interaction.user) return;

    const userId = interaction.user.id;

    await database.ensureUser(userId);

    if (interaction.isChatInputCommand()) {
        const cmd = interaction.commandName;

        // Owner-only commands (none yet)
        const ownerOnly = [];
        if (ownerOnly.includes(cmd) && userId !== BOT_OWNER_ID) {
            return interaction.reply({
                content: "This command is restricted to the bot owner.",
                ephemeral: true
            });
        }

        if (isOnCooldown(userId, cmd)) {
            const expires = cooldowns.get(userId).get(cmd);
            const seconds = ((expires - Date.now()) / 1000).toFixed(1);

            return interaction.reply({
                content: `Please wait ${seconds}s before using **${cmd}** again.`,
                ephemeral: true
            });
        }

        setCooldown(userId, cmd, 5000);

        try {
            switch (cmd) {
                case "ping": return handlePingCommand(interaction);
                case 'add_role': return handleAddRoleCommand(interaction);
                case 'remove_role': return handleRemoveRoleCommand(interaction);
                case 'ban': return handleBanCommand(interaction);
                case 'kick': return handleKickCommand(interaction);
                case 'mute': return handleMuteCommand(interaction);
                case 'lockdown': return handleLockDownChannelCommand(interaction);
                case 'unlock': return handleLockDownChannelCommand(interaction);
                default:
                    return interaction.reply({
                        content: "Unknown command.",
                        ephemeral: true
                    });
            }
        } catch (e) {
            console.error("Command error:", e);
            return interaction.reply({
                content: "An error occurred while executing this command.",
                ephemeral: true
            });
        }
    }
});

// ------------------------------
// Proper ready event
// ------------------------------
client.on("clientReady", async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        await database.initialize();
        console.log("✔ Database initialized");
    } catch (err) {
        console.error("Error initializing database:", err);
    }

    await deployCommands();
});

client.login(TOKEN);