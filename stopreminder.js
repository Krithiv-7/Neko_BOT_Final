const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database.js');

module.exports = {
    name: 'stopreminder',
    description: 'Stop a repeating reminder',
    data: new SlashCommandBuilder()
        .setName('stopreminder')
        .setDescription('Stop a repeating reminder')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('The ID of the reminder to stop')
                .setRequired(true)
        ),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        let reminderId;
        
        if (isSlash) {
            reminderId = messageOrInteraction.options.getInteger('id');
        } else {
            reminderId = parseInt(args[0]);
            if (isNaN(reminderId)) {
                return await messageOrInteraction.reply('Please provide a valid reminder ID!');
            }
        }
        
        const userId = messageOrInteraction.author?.id || messageOrInteraction.user?.id;
        
        try {
            const changes = await Database.stopRepeatingReminder(userId, reminderId);
            
            if (changes > 0) {
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Reminder Stopped')
                    .setDescription(`Reminder with ID **${reminderId}** has been stopped.`)
                    .setTimestamp();
                
                if (isSlash) {
                    await messageOrInteraction.reply({ embeds: [embed] });
                } else {
                    await messageOrInteraction.reply({ embeds: [embed] });
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Reminder Not Found')
                    .setDescription(`No repeating reminder found with ID **${reminderId}**.`)
                    .setTimestamp();
                
                if (isSlash) {
                    await messageOrInteraction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    await messageOrInteraction.reply({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Error stopping reminder:', error);
            const errorMsg = 'Failed to stop reminder.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};