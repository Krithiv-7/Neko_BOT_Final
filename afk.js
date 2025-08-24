const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database.js');

module.exports = {
    name: 'afk',
    description: 'Set yourself as AFK with optional message',
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set yourself as AFK with optional message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Your AFK message')
                .setRequired(false)
        ),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        let afkMessage;
        if (isSlash) {
            afkMessage = messageOrInteraction.options.getString('message') || 'AFK';
        } else {
            afkMessage = args.join(' ') || 'AFK';
        }
        
        const userId = messageOrInteraction.author?.id || messageOrInteraction.user?.id;
        const username = messageOrInteraction.author?.username || messageOrInteraction.user?.username;
        
        try {
            await Database.setAFK(userId, afkMessage);
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('💤 AFK Set')
                .setDescription(`<@${userId}> is now AFK`)
                .setTimestamp()
                .setFooter({ text: `${username}` });
            
            if (isSlash) {
                await messageOrInteraction.reply({ embeds: [embed] });
            } else {
                await messageOrInteraction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error setting AFK:', error);
            const errorMsg = 'Failed to set AFK status.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};