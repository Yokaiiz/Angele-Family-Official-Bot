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
    return interaction.reply({
        content: `<@${userID}>`
    });
}

module.exports = {
    handlePingCommand,
};