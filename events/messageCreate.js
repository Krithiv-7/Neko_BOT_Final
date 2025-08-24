const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('../database/database.js');

// Simple file-based storage for autorole
const autoRoleFile = path.join(__dirname, '..', 'data', 'autoroles.json');

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

// Auto-response system with Makima-inspired personality (enhanced with sarcasm and humor)
const autoResponses = [
    "Ara ara~ Someone seems to need my attention. How... interesting. *sips tea*",
    "Oh my, you're quite the talkative one, aren't you? I do appreciate that quality. *not really*",
    "Hmm~ You remind me of someone I used to know. They were... useful. *until they weren't*",
    "Such passion in your words. I find that rather endearing, little one. *said with a smirk*",
    "How curious... Tell me more about what's troubling that little mind of yours. *like I actually care*",
    "You know, you're quite special. Not many catch my interest like this. *probably because you're the only one talking*",
    "Fufu~ Your enthusiasm is refreshing. Don't lose that spark. *it's amusing to watch*",
    "I see potential in you. That's not something I say lightly. *famous last words*",
    "Come now, don't be shy. I promise I don't bite... much. *grins mischievously*",
    "Your dedication is admirable. Perhaps we should discuss philosophy sometime. *or not*",
    "Wow, you're really something else. *in the most sarcastic way possible*",
    "I'm genuinely surprised you managed to type that without making a typo. *patronizingly*",
    "That's... certainly a perspective. *trying not to laugh*",
    "You have such unique ideas. *unlike the rest of the sane population*",
    "I can see why you'd think that. *I can't, but okay*",
    "Oh, you're still here? *pretending to be surprised*",
    "I'm sure that makes perfect sense to someone with your... *gestures vaguely* ...intelligence.",
    "You're absolutely right. *said like a disappointed parent*",
    "Well, that's one way to look at it. *the wrong way, but okay*",
    "I can see you've put a lot of thought into that. *probably too much*"
];

const topicResponses = {
    anime: [
        "Ah, anime... Such fascinating stories of power and control. Which ones have captured your attention? *probably something with unnecessary fan service*",
        "I do enjoy a good psychological thriller. The mind games are... exquisite. *and by exquisite, I mean entertaining to watch others suffer*",
        "Character development is so important, don't you think? Watching someone grow under guidance... *or break under pressure, either works*",
        "Anime has such deep philosophical themes. *or just explosions and fan service, but who's counting?*",
        "I love how anime can explore complex relationships. *like the relationship between a cat and its toy mouse*"
    ],
    cooking: [
        "Cooking is an art of control - over ingredients, temperature, timing. Much like... other things. *like people*",
        "I find there's something therapeutic about preparing meals for those you care about. *or those you want to poison*",
        "Food brings people together. It creates... bonds. Quite useful, really. *for manipulation purposes*",
        "Cooking shows real dedication. *unlike some people who can't even boil water*",
        "I appreciate a good home-cooked meal. *though I'd never admit I can't cook myself*"
    ],
    science: [
        "Knowledge is power, and power is... well, everything. What aspect of science intrigues you? *probably something I already know more about*",
        "The universe operates on such beautiful principles. Cause and effect, action and reaction... *like dominoes falling*",
        "Science helps us understand how to influence the world around us. Fascinating, isn't it? *in a terrifying way*",
        "I find scientific theories quite... predictable. *unlike people, thankfully*",
        "Science explains so much about our world. *but not everything, thankfully for job security*"
    ],
    general: [
        "That's... certainly a thought. *if we're being generous with the definition*",
        "I can see why you'd say that. *I really can't, but let's play along*",
        "How... original. *said with the enthusiasm of a dead battery*",
        "You have such unique perspectives. *uniquely wrong, but okay*",
        "I'm sure that's very important to you. *like my opinion of your cooking*"
    ]
};

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;
        
        // Update text message stats for leaderboard
        await Database.updateTextStats(message.author.id, message.guild.id);
        
        // Auto-response system
        if (Math.random() < 0.05) { // 5% chance
            await handleAutoResponse(message, client);
        }
    }
};

async function handleAutoResponse(message, client) {
    const userId = message.author.id;
    const content = message.content.toLowerCase();
    
    // Check cooldown
    const cooldowns = client.cooldowns;
    if (!cooldowns.has('autoresponse')) {
        cooldowns.set('autoresponse', new Map());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get('autoresponse');
    const cooldownAmount = 60000; // 1 minute
    
    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + cooldownAmount;
        if (now < expirationTime) return;
    }
    
    timestamps.set(userId, now);
    
    let response = '';
    
    // Topic-based responses
    if (content.includes('anime') || content.includes('manga')) {
        response = topicResponses.anime[Math.floor(Math.random() * topicResponses.anime.length)];
    } else if (content.includes('cook') || content.includes('food')) {
        response = topicResponses.cooking[Math.floor(Math.random() * topicResponses.cooking.length)];
    } else if (content.includes('science') || content.includes('space') || content.includes('philosophy')) {
        response = topicResponses.science[Math.floor(Math.random() * topicResponses.science.length)];
    } else {
        response = autoResponses[Math.floor(Math.random() * autoResponses.length)];
    }
    
    setTimeout(() => {
        message.reply(response);
    }, Math.random() * 2000 + 1000); // Random delay 1-3 seconds
}