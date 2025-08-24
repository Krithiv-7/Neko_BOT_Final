const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'removerole',
    description: 'Remove a role from a member',
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Remove a role from a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove the role from')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        // Check permissions
        const member = messageOrInteraction.member;
        if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            const reply = 'You don\'t have permission to manage roles!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        let targetUser, role;
        
        if (isSlash) {
            targetUser = messageOrInteraction.options.getUser('user');
            role = messageOrInteraction.options.getRole('role');
        } else {
            if (args.length < 2) {
                return await messageOrInteraction.reply('Usage: `*removerole @user @role`');
            }
            
            const userId = args[0]?.replace(/[<@!>]/g, '');
            const roleId = args[1]?.replace(/[<@&>]/g, '');
            
            targetUser = await client.users.fetch(userId).catch(() => null);
            role = messageOrInteraction.guild.roles.cache.get(roleId);
        }
        
        if (!targetUser || !role) {
            const reply = 'Please provide a valid user and role!';
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
        
        if (!targetMember.roles.cache.has(role.id)) {
            const reply = 'User doesn\'t have this role!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        try {
            await targetMember.roles.remove(role);
            
            const embed = new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('❌ Role Removed')
                .setDescription(`**${role.name}** role has been removed from **${targetUser.username}**.`)
                .addFields(
                    { name: 'User', value: `<@${targetUser.id}>`, inline: true },
                    { name: 'Role', value: `<@&${role.id}>`, inline: true },
                    { name: 'Moderator', value: `<@${member.id}>`, inline: true }
                )
                .setTimestamp();
            
            if (isSlash) {
                await messageOrInteraction.reply({ embeds: [embed] });
            } else {
                await messageOrInteraction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error removing role:', error);
            const errorMsg = 'Failed to remove the role.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};