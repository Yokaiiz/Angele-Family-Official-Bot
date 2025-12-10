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

async function handleAddRoleCommand(interaction) {
    const member = interaction.options.getMember('member');
    const role = interaction.options.getRole('role');

    const botMember = interaction.guild.members.me;

    // Check if user can run this command
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: "You do not have permission to use this command.",
            ephemeral: true
        });
    }

    // Check if bot has ManageRoles
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
            content: "I do not have permission to manage roles.",
            ephemeral: true
        });
    }

    // Check role hierarchy: bot must be ABOVE the role it tries to assign
    if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
            content: "I cannot add this role because it is higher than or equal to my highest role.",
            ephemeral: true
        });
    }

    // Check role hierarchy: bot must be ABOVE the target member
    if (member.roles.highest.position >= botMember.roles.highest.position) {
        return interaction.reply({
            content: "I cannot modify this member because their highest role is above or equal to mine.",
            ephemeral: true
        });
    }

    try {
        await member.roles.add(role);
        return interaction.reply({
            content: `Successfully added role **${role.name}** to **${member.user.tag}**.`,
            ephemeral: true
        });
    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: "There was an error adding the role. Please check my permissions and role hierarchy.",
            ephemeral: true
        });
    }
}

async function handleRemoveRoleCommand(interaction) {
    const member = interaction.options.getMember('member');
    const role = interaction.options.getRole('role');

    const botMember = interaction.guild.members.me;

    // Check user's permission to run this command
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            content: "You do not have permission to use this command.",
            ephemeral: true
        });
    }

    // Check if bot has required permissions
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
            content: "I do not have permission to manage roles.",
            ephemeral: true
        });
    }

    // Check role hierarchy: bot must be ABOVE the role it tries to remove
    if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
            content: "I cannot remove this role because it is higher than or equal to my highest role.",
            ephemeral: true
        });
    }

    // Check role hierarchy: bot must be ABOVE the target member
    if (member.roles.highest.position >= botMember.roles.highest.position) {
        return interaction.reply({
            content: "I cannot modify this member because their highest role is above or equal to mine.",
            ephemeral: true
        });
    }

    try {
        await member.roles.remove(role);
        return interaction.reply({
            content: `Successfully removed role **${role.name}** from **${member.user.tag}**.`,
            ephemeral: true
        });
    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: "There was an error removing the role. Please check my permissions and role hierarchy.",
            ephemeral: true
        });
    }
}

async function handleBanCommand(interaction) {
    const member = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const botMember = interaction.guild.members.me;
    const logChannel = interaction.guild.channels.cache.get('1445792025088884756');

    // User permission check
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({
            content: "You do not have permission to ban members.",
            ephemeral: true
        });
    }

    // Bot permission check
    if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.reply({
            content: "I do not have permission to ban members.",
            ephemeral: true
        });
    }

    // Cannot ban self
    if (member.id === interaction.member.id) {
        return interaction.reply({
            content: "You cannot ban yourself.",
            ephemeral: true
        });
    }

    // Cannot ban the server owner
    if (member.id === interaction.guild.ownerId) {
        return interaction.reply({
            content: "I cannot ban the server owner.",
            ephemeral: true
        });
    }

    // Bot hierarchy check
    if (member.roles.highest.position >= botMember.roles.highest.position) {
        return interaction.reply({
            content: "I cannot ban this user because their highest role is above or equal to mine.",
            ephemeral: true
        });
    }

    // User hierarchy check (optional but recommended)
    if (member.roles.highest.position >= interaction.member.roles.highest.position &&
        interaction.member.id !== interaction.guild.ownerId) 
    {
        return interaction.reply({
            content: "You cannot ban this user because their highest role is above or equal to yours.",
            ephemeral: true
        });
    }

    try {
        await member.ban({ reason });

        if (logChannel) {
            logChannel.send(
                `**${member.user.tag}** was banned by **${interaction.user.tag}** for: **${reason}**.`
            );
        }

        return interaction.reply({
            content: `Successfully banned **${member.user.tag}** for reason: **${reason}**.`,
            ephemeral: true
        });

    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: "There was an error banning the member. Please ensure I have the correct permissions and hierarchy position.",
            ephemeral: true
        });
    }
}

async function handleKickCommand(interaction) {
    const member = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const botMember = interaction.guild.members.me;
    const logChannel = interaction.guild.channels.cache.get('1445792025088884756');

    // Permission check for the user calling the command
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({
            content: "You do not have permission to kick members.",
            ephemeral: true
        });
    }

    // Permission check for the bot
    if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({
            content: "I do not have permission to kick members.",
            ephemeral: true
        });
    }

    // Cannot kick self
    if (member.id === interaction.member.id) {
        return interaction.reply({
            content: "You cannot kick yourself.",
            ephemeral: true
        });
    }

    // Cannot kick server owner
    if (member.id === interaction.guild.ownerId) {
        return interaction.reply({
            content: "I cannot kick the server owner.",
            ephemeral: true
        });
    }

    // Bot hierarchy check
    if (member.roles.highest.position >= botMember.roles.highest.position) {
        return interaction.reply({
            content: "I cannot kick this user because their highest role is above or equal to mine.",
            ephemeral: true
        });
    }

    // User hierarchy check
    if (
        member.roles.highest.position >= interaction.member.roles.highest.position &&
        interaction.member.id !== interaction.guild.ownerId
    ) {
        return interaction.reply({
            content: "You cannot kick this user because their highest role is above or equal to yours.",
            ephemeral: true
        });
    }

    try {
        await member.kick(reason);

        if (logChannel) {
            logChannel.send(
                `**${member.user.tag}** was kicked by **${interaction.user.tag}** for reason: **${reason}**.`
            );
        }

        return interaction.reply({
            content: `Successfully kicked **${member.user.tag}** for reason: **${reason}**.`,
            ephemeral: true
        });

    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: "There was an error kicking the member. Please ensure I have the correct permissions and role hierarchy.",
            ephemeral: true
        });
    }
}

async function handleMuteCommand(interaction) {
    const member = interaction.options.getMember('member');
    const duration = interaction.options.getInteger('duration'); // minutes
    const botMember = interaction.guild.members.me;
    const logChannel = interaction.guild.channels.cache.get('1445792025088884756');

    // User permission check
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({
            content: "You do not have permission to mute members.",
            ephemeral: true
        });
    }

    // Bot permission check
    if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({
            content: "I do not have permission to mute members. (Grant `Timeout Members` in role settings.)",
            ephemeral: true
        });
    }

    // Cannot mute self
    if (member.id === interaction.member.id) {
        return interaction.reply({
            content: "You cannot mute yourself.",
            ephemeral: true
        });
    }

    // Cannot mute owner
    if (member.id === interaction.guild.ownerId) {
        return interaction.reply({
            content: "I cannot mute the server owner.",
            ephemeral: true
        });
    }

    // Role hierarchy checks
    if (member.roles.highest.position >= botMember.roles.highest.position) {
        return interaction.reply({
            content: "❌ I cannot mute this user because their role is above or equal to mine.",
            ephemeral: true
        });
    }

    if (
        member.roles.highest.position >= interaction.member.roles.highest.position &&
        interaction.member.id !== interaction.guild.ownerId
    ) {
        return interaction.reply({
            content: "❌ You cannot mute this user because their role is above or equal to yours.",
            ephemeral: true
        });
    }

    const durationMs = duration * 60 * 1000;

    try {
        await member.timeout(durationMs, `Muted by ${interaction.user.tag} for ${duration} minutes`);

        if (logChannel) {
            logChannel.send(
                `🔇 **${member.user.tag}** muted by **${interaction.user.tag}** for **${duration} minutes**.`
            );
        }

        return interaction.reply({
            content: `✅ Muted **${member.user.tag}** for **${duration} minutes**.`,
            ephemeral: true
        });

    } catch (error) {
        console.error("Mute error:", error);

        return interaction.reply({
            content: "⚠️ Failed to mute. This usually means my role is below the target or I lack `Timeout Members` permission.",
            ephemeral: true
        });
    }
}

async function handleLockDownChannelCommand(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const botMember = interaction.guild.members.me;

    // User permission check
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: "You do not have permission to manage channels.",
            ephemeral: true
        });
    }

    // Bot permission check
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: "I do not have permission to manage channels.",
            ephemeral: true
        });
    }

    // Cannot lockdown DMs or unsupported channel types
    if (!channel.isTextBased()) {
        return interaction.reply({
            content: "I can only lock down text channels.",
            ephemeral: true
        });
    }

    // Bot must be above any role the channel overwrites
    for (const overwrite of channel.permissionOverwrites.cache.values()) {
        if (overwrite.type === 0) { // Role overwrite
            const role = interaction.guild.roles.cache.get(overwrite.id);

            if (role && role.position >= botMember.roles.highest.position) {
                return interaction.reply({
                    content: `I cannot modify this channel because it contains overwrites for the role **${role.name}**, which is above or equal to my highest role.`,
                    ephemeral: true
                });
            }
        }
    }

    try {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
        });

        return interaction.reply({
            content: `Successfully locked down the channel ${channel}.`,
            ephemeral: true
        });

    } catch (error) {
        console.error(error);
        return interaction.reply({
            content: "There was an error locking down the channel. Please ensure I have the correct permissions and hierarchy position.",
            ephemeral: true
        });
    }
}

async function handleUnlockChannelCommand(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const botMember = interaction.guild.members.me;

    // User permission check
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: "❌ You do not have permission to manage channels.",
            ephemeral: true
        });
    }

    // Bot permission check
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: "❌ I do not have permission to manage channels.",
            ephemeral: true
        });
    }

    // Validate channel type
    if (!channel.isTextBased() || channel.type === 1) { 
        // channel.type === 1 prevents selecting DM channels in some cases
        return interaction.reply({
            content: "❌ I can only unlock text channels within servers.",
            ephemeral: true
        });
    }

    try {
        await channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
                SendMessages: null,
                AddReactions: null
            }
        );

        return interaction.reply({
            content: `🔓 Successfully unlocked ${channel}.`,
            ephemeral: true
        });

    } catch (error) {
        console.error("Unlock command error:", error);

        return interaction.reply({
            content: "❌ There was an error unlocking the channel. Make sure I have permission and that my role is high enough.",
            ephemeral: true
        });
    }
}

module.exports = {
    handlePingCommand,
    handleAddRoleCommand,
    handleRemoveRoleCommand,
    handleBanCommand,
    handleKickCommand,
    handleMuteCommand,
    handleLockDownChannelCommand,
    handleUnlockChannelCommand,
};