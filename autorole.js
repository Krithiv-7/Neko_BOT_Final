const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Simple file-based storage for autorole
const autoRoleFile = path.join(__dirname, '..', 'data', 'autoroles.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function getAutoRoles() {
    try {
        if (fs.existsSync(autoRoleFile)) {
            return JSON.parse(fs.readFileSync(autoRoleFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading autoroles:', error);
    }
    return {};
}

function saveAutoRoles(data) {
    try {
        fs.writeFileSync(autoRoleFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving autoroles:', error);
    }
}

module.exports = {
    name: 'autorole',
    description: 'Configure auto-role for new members',
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configure auto-role for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the auto-role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to automatically give to new members')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove the auto-role')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View the current auto-role')
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
        
        const guildId = messageOrInteraction.guild.id;
        const autoRoles = getAutoRoles();
        
        let action, role;
        
        if (isSlash) {
            action = messageOrInteraction.options.getSubcommand();
            if (action === 'set') {
                role = messageOrInteraction.options.getRole('role');
            }
        } else {
            action = args[0]?.toLowerCase();
            if (action === 'set' && args[1]) {
                const roleId = args[1].replace(/[<@&>]/g, '');
                role = messageOrInteraction.guild.roles.cache.get(roleId);
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTimestamp();
        
        switch (action) {
            case 'set':
                if (!role) {
                    embed.setColor('#FF4444')
                        .setTitle('❌ Error')
                        .setDescription('Please provide a valid role!');
                } else {
                    autoRoles[guildId] = role.id;
                    saveAutoRoles(autoRoles);
                    
                    embed.setTitle('✅ Auto-Role Set')
                        .setDescription(`New members will automatically receive the **${role.name}** role.`)
                        .addFields({ name: 'Role', value: `<@&${role.id}>`, inline: true });
                }
                break;
                
            case 'remove':
                if (autoRoles[guildId]) {
                    delete autoRoles[guildId];
                    saveAutoRoles(autoRoles);
                    
                    embed.setTitle('🗑️ Auto-Role Removed')
                        .setDescription('Auto-role has been disabled for this server.');
                } else {
                    embed.setColor('#FF4444')
                        .setTitle('❌ Error')
                        .setDescription('No auto-role is currently set for this server.');
                }
                break;
                
            case 'view':
                if (autoRoles[guildId]) {
                    const currentRole = messageOrInteraction.guild.roles.cache.get(autoRoles[guildId]);
                    if (currentRole) {
                        embed.setTitle('👁️ Current Auto-Role')
                            .setDescription(`New members automatically receive the **${currentRole.name}** role.`)
                            .addFields({ name: 'Role', value: `<@&${currentRole.id}>`, inline: true });
                    } else {
                        embed.setColor('#FFA500')
                            .setTitle('⚠️ Warning')
                            .setDescription('Auto-role is set but the role no longer exists.');
                    }
                } else {
                    embed.setTitle('👁️ Auto-Role Status')
                        .setDescription('No auto-role is currently set for this server.');
                }
                break;
                
            default:
                embed.setColor('#FF4444')
                    .setTitle('❌ Invalid Action')
                    .setDescription('Usage: `*autorole <set/remove/view> [@role]`\nExample: `*autorole set @Member`');
        }
        
        if (isSlash) {
            await messageOrInteraction.reply({ embeds: [embed] });
        } else {
            await messageOrInteraction.reply({ embeds: [embed] });
        }
    }
};

// Event handler for new members (add this to events/guildMemberAdd.js)
module.exports.handleNewMember = async (member) => {
    const autoRoles = getAutoRoles();
    const roleId = autoRoles[member.guild.id];
    
    if (roleId) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
            try {
                await member.roles.add(role);
                console.log(`Auto-role ${role.name} given to ${member.user.username}`);
            } catch (error) {
                console.error('Error giving auto-role:', error);
            }
        }
    }
};