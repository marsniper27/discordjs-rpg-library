// Example of a command that modifies the brawl

import { SlashCommandBuilder, Guild, ChatInputCommandInteraction, GuildTextBasedChannel, Message, MessageComponentInteraction, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, User, Options } from 'discord.js';
import { brawlManager } from '../managers/BrawlManager'; // Adjust the path accordingly
import { Player } from '../classes/Player';
import { findEntryByID } from 'mars-simple-mongodb';
import { Mischief } from '../classes/Skill';
import { SpecialPlayers } from '../classes/specialPlayers';

export const data: any = new SlashCommandBuilder()
    .setName('modify_brawl')
    .setDescription('Modify an ongoing brawl')
    .addStringOption((option: any) =>
        option.setName('brawl_id')
            .setDescription('Id for the brawl to modify')
            .setRequired(true))
    .addStringOption((option: any) =>
        option.setName('action')
            .setDescription('Action to perform (add_player, change_time)')
            .setRequired(true))
    .addUserOption((option: any) =>
        option.setName('user')
            .setDescription('User to add to the brawl'))
    .addNumberOption((option: any) =>
        option.setName('new_time')
            .setDescription('New countdown time in seconds'))

export async function execute(interaction: ChatInputCommandInteraction) {
    const brawlId = interaction.options.getString('brawl_id'); 
    if (!brawlId) {
        await interaction.reply({ content: 'Brawl ID is required.', ephemeral: true });
        return;
    }
    const guildId = interaction.guildId;
    if (!guildId) return;

    const brawl = brawlManager.getBrawl(brawlId);

    if (!brawl) {
        await interaction.reply({ content: 'There is no ongoing brawl in this server.', ephemeral: true });
        return;
    }

    const action = interaction.options.getString('action');
    if (!action) return;
    // const action = interaction.options.getString('action', true).toLowerCase()||"";
    if (action === 'add_player') {
        const user = interaction.options.get('user')?.user;
        if (user && interaction.guildId && interaction.guild && interaction.channel) {

            if (brawl.players.length >= brawl.settings.maxPlayers) {
                interaction.reply({ content: 'The brawl is already full!', ephemeral: true });
                return;
            }

            if (brawl.players.find(player => player.name === user.username)) {
                interaction.reply({ content: 'You have already joined the brawl!', ephemeral: true });
                return;
            }

            const member = await getGuildMember(interaction.guild, user); 
            let playerHealth = 100
            if (member) {
                playerHealth += brawl.settings.calculatePlayerRoleBonus(member as GuildMember);
            }
         
            const playerData = await findEntryByID("users", interaction.guildId, user.id);
            let player;
            if (playerData) {
                if (playerData.coins < brawl.settings.fee) {
                    await interaction.reply({ content: "You do not have enough coins to join!", ephemeral: true });
                    return;
                }

                player = await Player.createInstance(user, guildId);

                // Subtract a coin and reset player stats
                player.coins -= brawl.settings.fee;
                player.level = 1;
                player.xp = 0;
                player.hp = playerHealth;
                player.attack = 10;
                player.naturalArmor = 0.1;
                player.critChance = 0.3;
                player.critDamage = 1.2;
                player.pet = undefined;
                player.skill = brawl.settings.useMischief ? new Mischief() : undefined;

                interaction.reply({ content: `${user.username} has been added to the Brawl  --${playerHealth}`, ephemeral: true });

            } else {
                player = await Player.createInstance(user, guildId);
                player.level = 1;
                player.xp = 0;
                player.hp = playerHealth;
                player.attack = 10;
                player.naturalArmor = 0.1;
                player.critChance = 0.3;
                player.critDamage = 1.2;
                player.pet = undefined;
                player.skill = brawl.settings.useMischief ? new Mischief() : undefined;
                interaction.reply({ content: `Welcome to your first Brawl ${user.username}  --${playerHealth}`, ephemeral: true });
            }
            const playerIcon = SpecialPlayers.getIcon(user.username);
            player.icon = playerIcon;
            brawl.players.push(player);
            let playercounttext;
            if (brawl.players.length > 10) {
                playercounttext = `\n**🔥🔥 ${brawl.players.length}/${brawl.settings.maxPlayers} players!! 🔥🔥**\n`;
            } else {
                playercounttext = `\n**${brawl.players.length}/${brawl.settings.maxPlayers} players.**\n`;
            }
            let playerjoined = brawl.players.map(player => `${player.icon}  **${player.name}**`).join('\n');
            await brawl.playerMessage.edit({ content: `**The following players have joined the Brawl:**\n\n ${playerjoined}${playercounttext}` });
            brawlManager.updateBrawl(brawlId, brawl.players);
            try {
                if (interaction.channel?.isTextBased() && 'name' in interaction.channel) {
                    const channelName = interaction.channel.name;  // Safe access
                    const inviteLink = `https://discord.com/channels/${interaction.guild?.id}/${interaction.channel.id}/${brawl.interaction.id}`;

                    await user.send({
                        content: `🔥 You have been added to the brawl in **${interaction.guild?.name}**!\n\n`
                            + `👤 **Added By:** ${interaction.user.username}\n`
                            + `📍 **Channel:** ${channelName}\n`
                            + `🔗 [Jump to the Brawl](${inviteLink})`,
                    });
                } else {
                    console.error("Could not determine channel name, might be a DM.");
                }
            } catch (error) {
                console.error(`Could not send DM to ${user.tag}:`, error);
            }
            // Notify or trigger the interactive brawl to refresh its state
            brawlManager.refreshBrawlState(brawlId); // You would define this in your brawlManager to notify the game logic

            // await interaction.reply({ content: `${user.username} has been added to the brawl!` });
        }
    } else if (action === 'change_time') {
        const newTime = interaction.options.get('new_time');
        if (newTime && typeof newTime.value === 'number') {
            console.log('newTime number:', newTime.value);
            const newWaitTime = newTime.value * 1000; // Convert to milliseconds
            brawlManager.updateBrawlWaitTime(brawlId, newWaitTime);
            await interaction.reply({ content: `Brawl time changed to ${newTime.value} seconds.` });
        } else if (newTime && typeof newTime.value === 'string') {
            console.log('newTime string:', newTime.value);
            const newWaitTime = parseInt(newTime.value) * 1000; // Convert to milliseconds
            brawlManager.updateBrawlWaitTime(brawlId, newWaitTime);
            await interaction.reply({ content: `Brawl time changed to ${newTime.value} seconds.` });

        }
    }
}


async function getGuildMember(guild: Guild, user: User): Promise<GuildMember | null> {
    try {
        const member: GuildMember = await guild.members.fetch(user.id);
        return member;
    } catch (error) {
        console.error(`Error fetching GuildMember: ${error}`);
        return null;
    }
}