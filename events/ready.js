const { REST, Routes, ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Register slash commands
        const commands = [];
        client.slashCommands.forEach(command => {
            commands.push(command.data.toJSON());
        });
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        try {
            console.log('Started refreshing application (/) commands.');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
        
        // Rotating presence status every 10 seconds
        let statusIndex = 0;
        const statuses = [
            {
                status: 'online',
                activity: {
                    name: 'support our server: https://discord.gg/2rueyR4MPm',
                    type: ActivityType.Playing
                }
            },
            {
                status: 'idle',
                activity: {
                    name: 'talking with server members',
                    type: ActivityType.Listening
                }
            },
            {
                status: 'dnd',
                activity: {
                    name: `helping ${client.guilds.cache.size} servers`,
                    type: ActivityType.Watching
                }
            },
            {
                status: 'online',
                activity: {
                    name: 'watching anime',
                    type: ActivityType.Streaming,
                    url: 'https://twitch.tv/neko_bot'
                }
            }
        ];
        
        const updatePresence = () => {
            const currentStatus = statuses[statusIndex];
            
            // Update the server count for DND status
            if (statusIndex === 2) {
                currentStatus.activity.name = `helping ${client.guilds.cache.size} servers`;
            }
            
            client.user.setPresence({
                status: currentStatus.status,
                activities: [currentStatus.activity]
            });
            
            console.log(`Presence updated: ${currentStatus.status} - ${currentStatus.activity.name}`);
            
            statusIndex = (statusIndex + 1) % statuses.length;
        };
        
        // Set initial presence
        updatePresence();
        
        // Update presence every 10 seconds
        setInterval(updatePresence, 10000);
    }
};