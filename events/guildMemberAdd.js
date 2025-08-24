const { handleNewMember } = require('../commands/autorole.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // Handle auto-role
        await handleNewMember(member);
        
        console.log(`${member.user.username} joined ${member.guild.name}`);
    }
};