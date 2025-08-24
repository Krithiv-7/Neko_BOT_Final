const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Shows all available commands',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get help for a specific command')
                .setRequired(false)
        ),
    
    async execute(messageOrInteraction, args, client) {
        const isSlash = messageOrInteraction.isCommand?.() || messageOrInteraction.isChatInputCommand?.();
        const command = isSlash ? messageOrInteraction.options?.getString('command') : args?.[0];
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🤖 Bot Commands Help')
            .setDescription('Here are all available commands. Use `/help <command>` for detailed information.')
            .addFields(
                {
                    name: '🛡️ Moderation Commands',
                    value: [
                        '`/kick` - Kick a member from the server',
                        '`/ban` - Ban a member from the server', 
                        '`/timeout` - Timeout (mute) a member temporarily',
                        '`/giverole` - Give a role to a member',
                        '`/removerole` - Remove a role from a member'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚙️ Utility Commands', 
                    value: [
                        '`/say` - Send a custom message (supports images and embeds)',
                        '`/autorole` - Configure auto-role for new members',
                        '`/afk` - Set yourself as AFK with optional message',
                        '`/help` - Show this help message'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📊 Other Commands',
                    value: [
                        '`/leaderboard` - Show server activity leaderboard',
                        '`/reminder` - Set a reminder with optional image',
                        '`/stopreminder` - Stop a repeating reminder'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📝 Prefix Commands',
                    value: 'You can also use prefix commands with `*`\nExample: `*kick @user reason`, `*say Hello {newline} World!`',
                    inline: false
                },
                {
                    name: '💡 Tips',
                    value: [
                        '• Use `{newline}` in say command for line breaks',
                        '• Auto-role automatically gives roles to new members', 
                        '• All moderation commands require appropriate permissions'
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: `Bot Prefix: * • Today at ${new Date().toLocaleTimeString()}` })
            .setTimestamp();
        
        if (isSlash) {
            await messageOrInteraction.reply({ embeds: [embed] });
        } else {
            await messageOrInteraction.reply({ embeds: [embed] });
        }
    }
};