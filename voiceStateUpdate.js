const Database = require('../database/database.js');

// Track voice session start times
const voiceSessions = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const userId = newState.id;
        const guildId = newState.guild.id;
        
        // User joined a voice channel
        if (!oldState.channelId && newState.channelId) {
            voiceSessions.set(userId, Date.now());
        }
        
        // User left a voice channel
        if (oldState.channelId && !newState.channelId) {
            const startTime = voiceSessions.get(userId);
            if (startTime) {
                const sessionLength = Math.floor((Date.now() - startTime) / 1000); // in seconds
                await Database.updateVoiceStats(userId, guildId, sessionLength);
                voiceSessions.delete(userId);
            }
        }
        
        // User switched channels (count as continuous session)
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            // Keep the same session start time
        }
    }
};