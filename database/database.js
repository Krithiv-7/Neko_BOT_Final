const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // Ensure data directory exists
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
        this.db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'bot.db'));
        this.init();
    }
    
    init() {
        this.db.serialize(() => {
            // AFK table
            this.db.run(`CREATE TABLE IF NOT EXISTS afk (
                userId TEXT PRIMARY KEY,
                message TEXT,
                timestamp INTEGER,
                mentions TEXT
            )`);
            
            // User memory table
            this.db.run(`CREATE TABLE IF NOT EXISTS user_memory (
                userId TEXT,
                topic TEXT,
                content TEXT,
                timestamp INTEGER
            )`);
            
            // Leaderboard table
            this.db.run(`CREATE TABLE IF NOT EXISTS leaderboard (
                userId TEXT,
                guildId TEXT,
                textMessages INTEGER DEFAULT 0,
                voiceTime INTEGER DEFAULT 0,
                PRIMARY KEY (userId, guildId)
            )`);
            
            // Reminders table
            this.db.run(`CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                channelId TEXT,
                message TEXT,
                imageUrl TEXT,
                reminderTime INTEGER,
                createdAt INTEGER,
                repeat BOOLEAN DEFAULT FALSE,
                repeatInterval TEXT
            )`);
        });
    }
    
    // AFK methods
    setAFK(userId, message) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            this.db.run(
                'INSERT OR REPLACE INTO afk (userId, message, timestamp, mentions) VALUES (?, ?, ?, ?)',
                [userId, message, timestamp, '[]'],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    getAFK(userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM afk WHERE userId = ?',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
    
    removeAFK(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM afk WHERE userId = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }
    
    addMention(userId, mentionData) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT mentions FROM afk WHERE userId = ?', [userId], (err, row) => {
                if (err) reject(err);
                else if (row) {
                    const mentions = JSON.parse(row.mentions || '[]');
                    mentions.push(mentionData);
                    this.db.run(
                        'UPDATE afk SET mentions = ? WHERE userId = ?',
                        [JSON.stringify(mentions), userId],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                } else {
                    resolve();
                }
            });
        });
    }
    
    // Memory methods
    addMemory(userId, topic, content) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            this.db.run(
                'INSERT INTO user_memory (userId, topic, content, timestamp) VALUES (?, ?, ?, ?)',
                [userId, topic, content, timestamp],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    getMemories(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM user_memory WHERE userId = ? ORDER BY timestamp DESC LIMIT ?',
                [userId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
    
    // Leaderboard methods
    updateTextStats(userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR IGNORE INTO leaderboard (userId, guildId) VALUES (?, ?)',
                [userId, guildId]
            );
            this.db.run(
                'UPDATE leaderboard SET textMessages = textMessages + 1 WHERE userId = ? AND guildId = ?',
                [userId, guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    updateVoiceStats(userId, guildId, timeInSeconds) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR IGNORE INTO leaderboard (userId, guildId) VALUES (?, ?)',
                [userId, guildId]
            );
            this.db.run(
                'UPDATE leaderboard SET voiceTime = voiceTime + ? WHERE userId = ? AND guildId = ?',
                [timeInSeconds, userId, guildId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    getLeaderboard(guildId, type = 'text', limit = 10) {
        return new Promise((resolve, reject) => {
            const column = type === 'voice' ? 'voiceTime' : 'textMessages';
            this.db.all(
                `SELECT * FROM leaderboard WHERE guildId = ? ORDER BY ${column} DESC LIMIT ?`,
                [guildId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
    
    // Reminder methods
    addReminder(userId, channelId, message, imageUrl, reminderTime, repeat = false, repeatInterval = null) {
        return new Promise((resolve, reject) => {
            const createdAt = Date.now();
            this.db.run(
                'INSERT INTO reminders (userId, channelId, message, imageUrl, reminderTime, createdAt, repeat, repeatInterval) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, channelId, message, imageUrl, reminderTime, createdAt, repeat, repeatInterval],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    getExpiredReminders(currentTime) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM reminders WHERE reminderTime <= ?',
                [currentTime.getTime()],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
    
    deleteReminder(id) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM reminders WHERE id = ?',
                [id],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    // Stop repeating reminder
    stopRepeatingReminder(userId, reminderId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE reminders SET repeat = FALSE WHERE id = ? AND userId = ?',
                [reminderId, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }
    
    // Get all repeating reminders for a user
    getUserRepeatingReminders(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM reminders WHERE userId = ? AND repeat = TRUE',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }
}

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

module.exports = new Database();