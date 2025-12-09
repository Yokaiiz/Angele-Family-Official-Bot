const {
    buttonBuilder,
    ActionRowBuilder,
    subtext,
    italic,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require("@discordjs/builders");
const {
    EmbedBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ComponentType,
} = require("discord.js");
const database = require("./database.js");

async function handlePingCommand(interaction) {
    const userID = interaction.user.id;
    await database.ensureUser(userID);
    const userData = await database.getUserData(userID);
    userData.name ||= interaction.user.displayName;
    await database.saveUserData(userID, userData);
    return interaction.reply({
        content: `Pong! Your name is set to **${userData.name}**.`,
    });
}

module.exports = {
    handlePingCommand,
};