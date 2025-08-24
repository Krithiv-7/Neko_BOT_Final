const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Ban a member from the server',
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        // Check permissions
        const member = messageOrInteraction.member;
        if (!member.permissions.has(PermissionFlagsBits.BanMembers)) {
            const reply = 'You don\'t have permission to ban members!';
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
                return await messageOrInteraction.reply('Please mention a user to ban!');
            }
            
            targetUser = await client.users.fetch(userId).catch(() => null);
            reason = args.slice(1).join(' ') || 'No reason provided';
        }
        
        if (!targetUser) {
            const reply = 'Please provide a valid user to ban!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        try {
            await messageOrInteraction.guild.members.ban(targetUser, { reason });
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 Member Banned')
                .setDescription(`**${targetUser.username}** has been banned from the server.`)
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
            console.error('Error banning user:', error);
            const errorMsg = 'Failed to ban the user.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};