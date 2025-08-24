const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'timeout',
    description: 'Timeout (mute) a member temporarily',
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout (mute) a member temporarily')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of timeout (e.g., 10m, 1h, 1d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        // Check permissions
        const member = messageOrInteraction.member;
        if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            const reply = 'You don\'t have permission to timeout members!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        let targetUser, duration, reason;
        
        if (isSlash) {
            targetUser = messageOrInteraction.options.getUser('user');
            duration = messageOrInteraction.options.getString('duration');
            reason = messageOrInteraction.options.getString('reason') || 'No reason provided';
        } else {
            if (args.length < 2) {
                return await messageOrInteraction.reply('Usage: `*timeout @user <duration> [reason]`\nExample: `*timeout @user 10m Spamming`');
            }
            
            const userId = args[0]?.replace(/[<@!>]/g, '');
            duration = args[1];
            reason = args.slice(2).join(' ') || 'No reason provided';
            
            targetUser = await client.users.fetch(userId).catch(() => null);
        }
        
        if (!targetUser) {
            const reply = 'Please provide a valid user to timeout!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        const timeMs = ms(duration);
        if (!timeMs || timeMs > 2419200000) { // Max 28 days
            const reply = 'Invalid duration! Use formats like: 10m, 2h, 1d (max 28 days)';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        const targetMember = await messageOrInteraction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            const reply = 'User not found in this server!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        if (!targetMember.moderatable) {
            const reply = 'I cannot timeout this user!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        try {
            await targetMember.timeout(timeMs, reason);
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🔇 Member Timed Out')
                .setDescription(`**${targetUser.username}** has been timed out.`)
                .addFields(
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: `<@${member.id}>`, inline: true }
                )
                .setTimestamp();
            
            if (isSlash) {
                await messageOrInteraction.reply({ embeds: [embed] });
            } else {
                await messageOrInteraction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error timing out user:', error);
            const errorMsg = 'Failed to timeout the user.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};