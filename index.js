require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Create directories if they don't exist
const dirs = ['commands', 'events', 'database', 'data'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ]
});

// Initialize collections
client.commands = new Collection();
client.slashCommands = new Collection();
client.afkUsers = new Collection();
client.userMemory = new Collection();
client.cooldowns = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    if (command.data) {
        client.slashCommands.set(command.data.name, command);
    }
}

// Load events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Schedule reminder checks
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const Database = require('./database/database.js');
    const reminders = await Database.getExpiredReminders(now);
    
    for (const reminder of reminders) {
        try {
            const channel = await client.channels.fetch(reminder.channelId);
            const user = await client.users.fetch(reminder.userId);
            
            const embed = new EmbedBuilder()
                .setColor('#00D4AA')
                .setTitle('⏰ Reminder')
                .setDescription(reminder.message)
                .setTimestamp()
                .setFooter({ text: `Set ${Math.floor((now - new Date(reminder.createdAt)) / 60000)} minutes ago` });
            
            if (reminder.imageUrl) {
                embed.setImage(reminder.imageUrl);
            }
            
            await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] });
            
            // Handle repeating reminders
            if (reminder.repeat && reminder.repeatInterval) {
                const ms = require('ms');
                const nextTime = new Date(Date.now() + ms(reminder.repeatInterval));
                await Database.addReminder(
                    reminder.userId,
                    reminder.channelId,
                    reminder.message,
                    reminder.imageUrl,
                    nextTime.getTime(),
                    true,
                    reminder.repeatInterval
                );
            }
            
            await Database.deleteReminder(reminder.id);
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);