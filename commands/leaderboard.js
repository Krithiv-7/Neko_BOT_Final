const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database.js');

module.exports = {
    name: 'leaderboard',
    description: 'Show server activity leaderboard',
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show server activity leaderboard')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of leaderboard')
                .setRequired(false)
                .addChoices(
                    { name: 'Text Messages', value: 'text' },
                    { name: 'Voice Time', value: 'voice' }
                )
        ),
    
    async execute(messageOrInteraction, args, client) {
        if (!messageOrInteraction.guild) {
            const reply = 'This command can only be used in a server!';
            if (messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.()) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        let type = 'text';
        
        if (isSlash) {
            type = messageOrInteraction.options.getString('type') || 'text';
        } else {
            type = args[0] === 'voice' ? 'voice' : 'text';
        }
        
        try {
            const leaderboard = await Database.getLeaderboard(messageOrInteraction.guild.id, type, 10);
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🏆 ${type === 'voice' ? 'Voice Time' : 'Text Messages'} Leaderboard`)
                .setTimestamp();
            
            if (leaderboard.length === 0) {
                embed.setDescription('No data available yet. Start chatting or join voice channels!');
            } else {
                let description = '';
                for (let i = 0; i < leaderboard.length; i++) {
                    const entry = leaderboard[i];
                    const user = await client.users.fetch(entry.userId).catch(() => null);
                    const username = user ? user.username : 'Unknown User';
                    
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    
                    if (type === 'voice') {
                        const hours = Math.floor(entry.voiceTime / 3600);
                        const minutes = Math.floor((entry.voiceTime % 3600) / 60);
                        description += `${medal} **${username}** - ${hours}h ${minutes}m\n`;
                    } else {
                        description += `${medal} **${username}** - ${entry.textMessages} messages\n`;
                    }
                }
                embed.setDescription(description);
            }
            
            if (isSlash) {
                await messageOrInteraction.reply({ embeds: [embed] });
            } else {
                await messageOrInteraction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            const errorMsg = 'Failed to fetch leaderboard data.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};