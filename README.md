# Neko Discord Bot

An advanced Discord bot with moderation, utility, AFK system, auto-responses with memory, leaderboards, and reminders using Discord.js.

## Features

### 🛡️ Moderation Commands
- `/kick` - Kick a member from the server
- `/ban` - Ban a member from the server
- `/timeout` - Timeout (mute) a member temporarily
- `/giverole` - Give a role to a member
- `/removerole` - Remove a role from a member

### ⚙️ Utility & Fun
- `/say` - Custom messages with media support
- `/afk` - Complete AFK system with mentions tracking
- `/help` - Help command with detailed information
- `/autorole` - Auto-assign roles to new members

### 📊 Activity Tracking
- `/leaderboard` - Shows both text messages and voice time stats
- Auto-tracking for both VC and text activity

### ⏰ Advanced Reminders
- `/reminder` - Set one-time OR repeating reminders
- `/stopreminder` - Stop any repeating reminder
- Support for images, GIFs, videos in reminders

### 🤖 Makima-Inspired Auto-Response
- Personality: Calm, charming, manipulative, caring facade with sarcastic and humorous elements
- Memory system: Remembers past conversations with each user
- Smart responses: Different responses for anime, cooking, science topics
- Natural timing: Random delays, cooldowns to seem human-like

### 🎭 Dynamic Presence (rotates every 10 seconds)
- 🟢 Online: "support our server: https://discord.gg/2rueyR4MPm"
- 🟡 Idle: "talking with server members"
- 🔴 DND: "helping X servers" (shows real server count)
- 🟣 Streaming: "watching anime"

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Set up your `.env` file with your bot token and client ID
4. Run `npm start` to start the bot

## Usage

All commands work with both slash commands and prefix commands (`*`).

### Repeating Reminders
- Slash: `/reminder message:"Take medicine" time:"8h" repeat:true`
- Prefix: `*reminder Take medicine 8h repeat`

### Say Command
- `*say Hello everyone{newline}{newline}Welcome to our server!`
- Results in proper line breaks

### AFK System
- `*afk Going to sleep 😴🌙`
- When mentioned: Shows AFK message with time
- When returning: Welcome back message with mention history

## Project Structure
```
├── index.js              # Main bot file
├── package.json          # Dependencies
├── .env                  # Environment variables (not included for security)
├── database/
│   └── database.js       # SQLite database system
├── events/
│   ├── ready.js          # Bot startup + presence rotation
│   ├── messageCreate.js  # Auto-responses + AFK + prefix commands
│   ├── interactionCreate.js  # Slash command handling
│   ├── guildMemberAdd.js # Auto-role assignment
│   └── voiceStateUpdate.js # Voice activity tracking
├── commands/
│   ├── help.js           # Help command
│   ├── say.js            # Say command with {newline} + media
│   ├── afk.js            # AFK system
│   ├── reminder.js       # Reminders with repeat feature
│   ├── stopreminder.js   # Stop repeating reminders
│   ├── leaderboard.js    # Activity leaderboards
│   ├── autorole.js       # Auto-role management
│   ├── kick.js           # Kick moderation
│   ├── ban.js            # Ban moderation
│   ├── timeout.js        # Timeout moderation
│   ├── giverole.js       # Give role command
│   └── removerole.js     # Remove role command
└── README.md             # This file
```

## Security Note
Never share your bot token publicly. The `.env` file is not included in this repository for security reasons.

## Contributing
Feel free to fork this project and contribute your own improvements!

## License
This project is licensed under the MIT License.