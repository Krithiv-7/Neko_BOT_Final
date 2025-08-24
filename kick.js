const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Kick a member from the server',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        // Check permissions
        const member = messageOrInteraction.member;
        if (!member.permissions.has(PermissionFlagsBits.KickMembers)) {
            const reply = 'You don\'t have permission to kick members!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        let targetUser, reason;
        
        if (isSlash) {
            targetUser = messageOrInteraction.options.getUser('user');
            reason = messageOrInteraction.options.getString('reason') || 'No reason provided';
        } else {
            const userId = args[0]?.replace(/[<@!>]/g, '');
            if (!userId) {
                return await messageOrInteraction.reply('Please mention a user to kick!');
            }
            
            targetUser = await client.users.fetch(userId).catch(() => null);
            reason = args.slice(1).join(' ') || 'No reason provided';
        }
        
        if (!targetUser) {
            const reply = 'Please provide a valid user to kick!';
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
        
        if (!targetMember.kickable) {
            const reply = 'I cannot kick this user!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        try {
            await targetMember.kick(reason);
            
            const embed = new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('👢 Member Kicked')
                .setDescription(`**${targetUser.username}** has been kicked from the server.`)
                .addFields(
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
            console.error('Error kicking user:', error);
            const errorMsg = 'Failed to kick the user.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};