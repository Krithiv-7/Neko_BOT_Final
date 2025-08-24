const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Database = require('../database/database.js');
const ms = require('ms');

module.exports = {
    name: 'reminder',
    description: 'Set a reminder with optional image',
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Set a reminder with optional image')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The reminder message')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('time')
                .setDescription('When to remind you (e.g., 10m, 2h, 1d)')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image, GIF, or video to include')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('repeat')
                .setDescription('Repeat the reminder until stopped')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('repeat_interval')
                .setDescription('Interval for repeating reminder (e.g., 1d, 1w)')
                .setRequired(false)
        ),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        let message, timeStr, attachment, repeat, repeatInterval;
        
        if (isSlash) {
            message = messageOrInteraction.options.getString('message');
            timeStr = messageOrInteraction.options.getString('time');
            attachment = messageOrInteraction.options.getAttachment('image');
            repeat = messageOrInteraction.options.getBoolean('repeat') || false;
            repeatInterval = messageOrInteraction.options.getString('repeat_interval') || timeStr;
        } else {
            if (args.length < 2) {
                return await messageOrInteraction.reply('Usage: `*reminder <message> <time> [repeat]`\nExample: `*reminder "Do homework" 2h repeat`');
            }
            
            // Find time pattern in args
            const timeIndex = args.findIndex(arg => /^\d+[smhdw]$/i.test(arg));
            if (timeIndex === -1) {
                return await messageOrInteraction.reply('Please provide a valid time format (e.g., 10m, 2h, 1d)');
            }
            
            timeStr = args[timeIndex];
            message = args.slice(0, timeIndex).join(' ');
            attachment = messageOrInteraction.attachments?.first();
            repeat = args.includes('repeat');
            
            // Find repeat interval if specified
            const intervalIndex = args.findIndex(arg => arg === 'every');
            if (intervalIndex !== -1 && args[intervalIndex + 1]) {
                repeatInterval = args[intervalIndex + 1];
            } else {
                repeatInterval = timeStr;
            }
        }
        
        const timeMs = ms(timeStr);
        if (!timeMs) {
            const reply = 'Invalid time format! Use formats like: 10m, 2h, 1d, 30s';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        const userId = messageOrInteraction.author?.id || messageOrInteraction.user?.id;
        const channelId = messageOrInteraction.channel.id;
        const reminderTime = new Date(Date.now() + timeMs);
        
        try {
            await Database.addReminder(
                userId,
                channelId,
                message,
                attachment?.url || null,
                reminderTime.getTime(),
                repeat,
                repeatInterval
            );
            
            const embed = new EmbedBuilder()
                .setColor('#00D4AA')
                .setTitle('⏰ Reminder Set')
                .setDescription(`I'll remind you about: **${message}**`)
                .addFields(
                    { name: 'Time', value: `<t:${Math.floor(reminderTime.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Channel', value: `<#${channelId}>`, inline: true }
                )
                .setTimestamp();
            
            if (repeat) {
                embed.addFields({ name: 'Repeating', value: `Every ${repeatInterval}`, inline: true });
            }
            
            if (attachment) {
                embed.setThumbnail(attachment.url);
            }
            
            if (isSlash) {
                await messageOrInteraction.reply({ embeds: [embed] });
            } else {
                await messageOrInteraction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error setting reminder:', error);
            const errorMsg = 'Failed to set reminder.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};