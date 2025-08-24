const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'Send a custom message with optional image',
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Send a custom message (supports images and embeds)')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image, GIF, or video to attach')
                .setRequired(false)
        ),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        
        let messageContent, attachment;
        
        if (isSlash) {
            messageContent = messageOrInteraction.options.getString('message');
            attachment = messageOrInteraction.options.getAttachment('image');
        } else {
            messageContent = args.join(' ');
            attachment = messageOrInteraction.attachments?.first();
        }
        
        if (!messageContent) {
            const reply = 'Please provide a message to send!';
            if (isSlash) {
                return await messageOrInteraction.reply({ content: reply, ephemeral: true });
            } else {
                return await messageOrInteraction.reply(reply);
            }
        }
        
        // Process {newline} replacements
        const processedMessage = messageContent.replace(/{newline}/g, '\n');
        
        const messageOptions = { content: processedMessage };
        
        if (attachment) {
            // Validate file type
            const validTypes = ['image/', 'video/', 'application/octet-stream']; // octet-stream for GIFs
            const isValid = validTypes.some(type => attachment.contentType?.startsWith(type));
            
            if (isValid) {
                messageOptions.files = [attachment];
            }
        }
        
        try {
            if (isSlash) {
                await messageOrInteraction.reply('Message sent!');
                await messageOrInteraction.followUp(messageOptions);
            } else {
                await messageOrInteraction.delete().catch(() => {});
                await messageOrInteraction.channel.send(messageOptions);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMsg = 'Failed to send the message. Please check the file size and format.';
            if (isSlash) {
                await messageOrInteraction.reply({ content: errorMsg, ephemeral: true });
            } else {
                await messageOrInteraction.reply(errorMsg);
            }
        }
    }
};