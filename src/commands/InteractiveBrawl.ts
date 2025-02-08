//InteractiveBrawl.ts

import { SlashCommandBuilder, Message, MessageComponentInteraction, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, User, Options, Role } from 'discord.js';
import { findEntryByID, incrementFields, findDocuments } from "mars-simple-mongodb";
import { evaluate } from 'mathjs';
import { Player } from '../classes/Player';
import { Battle } from '../classes/Battle';
import { Mischief } from '../classes/Skill';
import { random, bold, GOLD } from '../classes/utils';
import { brawlManager } from '../managers/BrawlManager'; // Adjust the path accordingly
import { ServerSettings } from '../classes/ServerSettings';
import { SpecialPlayers } from '../classes/specialPlayers';

let counterMessage: Message | null = null;
const currency = '$';

export const data: any = new SlashCommandBuilder()
    .setName('interactive_brawl')
    .setDescription('All in - Last one standing wins!')
    .addNumberOption((option: any) =>
        option.setName('lead_time')
            .setDescription('Countdown time before brawl starts in minutes (default is 1.5mins)')
    )
    .addBooleanOption((option: any) =>
        option.setName('use_mischief')
            .setDescription('Enable mischief')
    );

export async function execute(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.guildId;

    if (!guildId || !interaction.inGuild()) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    if (!interaction.channel) {
        await interaction.reply({ content: 'This command can only be used in a channel.', ephemeral: true });
        return;
    }

    const settings = await ServerSettings.fetch(interaction, guildId);

    // Create trackers for the players and the players who have joined
    const players: Player[] = []; // This will hold the Player instances
    // let playerjoined = ''; // Track which players have joined
    const brawlStarter = interaction.user;

    // Start the brawl and store it in the manager
    // brawlManager.createBrawl(interaction, guildId, players, settings);


    const brawlEmbed = new EmbedBuilder()
        .setTitle('Gargoyle Brawl')
        .setDescription('The brawl is about to begin! Prepare yourself.')
        .addFields([
            {
                name: `Countdown Time:`,
                value: `${settings.waitTime}`,
            },
        ])
        .setColor(parseInt(settings.embedColor, 16))
        .setThumbnail(settings.brawlIcon); // Replace with your actual image URL

    const joinButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('join_brawl')
                .setLabel('---> Join <---')
                .setStyle(ButtonStyle.Success),
        );

    await interaction.reply({ embeds: [brawlEmbed], components: [joinButton] });
    //this message is where the players list is added as they join
    let playermessage = await interaction.channel.send(`😈`);
    const countdownMessage = await interaction.channel.send(`...`);
    brawlManager.createBrawl(interaction, guildId, players, settings, playermessage, countdownMessage);


    // Setup a collector or listener for button interaction
    const filter = (i: MessageComponentInteraction) => i.customId === 'join_brawl' && i.user.id !== interaction.client.user?.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: settings.waitTime }); // Adjust time as necessary


    collector.on('collect', async (i: MessageComponentInteraction) => {
        const user = i.user;

        const playerHealth = 100 + settings.calculatePlayerRoleBonus(interaction.member as GuildMember);

        if (i.customId === 'join_brawl') {
            if (players.length >= settings.maxPlayers) {
                i.reply({ content: 'The brawl is already full!', ephemeral: true });
                return;
            }

            if (players.find(player => player.name === user.username)) {
                i.reply({ content: `You have already joined the brawl!`, ephemeral: true });
                return;
            }

            const playerData = await findEntryByID("users", interaction.guildId, user.id);
            let player; 
            


            if (playerData) {
                if (playerData.coins < settings.fee) {
                    await i.reply({ content: "You do not have enough coins to join!", ephemeral: true });
                    return;
                }

                player = await Player.createInstance(user, guildId);

                // Subtract a coin and reset player stats
                player.coins -= settings.fee;
                player.level = 1;
                player.xp = 0;
                player.hp = playerHealth;
                player.attack = 10;
                player.naturalArmor = 0.1;
                player.critChance = 0.3;
                player.critDamage = 1.2;
                player.pet = undefined;
                player.skill = settings.useMischief ? new Mischief() : undefined;

                i.reply({ content: `You joined the Brawl  --${playerHealth}`, ephemeral: true });

            } else {
                player = await Player.createInstance(user, guildId);
                player.skill = settings.useMischief ? new Mischief() : undefined;
                i.reply({ content: `Welcome to your first Brawl ${user.username}`, ephemeral: true });
            }
            const playerIcon = SpecialPlayers.getIcon(user.username);
            player.icon = playerIcon;

            // Add player to the brawl
            players.push(player);


            const brawl = brawlManager.getBrawl(guildId);
            if (!brawl) return;
            let playerjoined = brawl.players.map(player => `${player.icon}  **${player.name}**`).join('\n');

            // playerjoined += `${specialPlayers[user.username] || '👤'}  **${user.username}**\n`;
            let playercounttext;
            if (players.length > 10) {
                playercounttext = `\n**🔥🔥 ${players.length}/${settings.maxPlayers} players!! 🔥🔥**\n`;
            } else {
                playercounttext = `\n**${players.length}/${settings.maxPlayers} players.**\n`;
            }

            // Update the player list message
            await playermessage.edit({ content: `**The following players have joined the Brawl:**\n\n ${playerjoined}${playercounttext}` });
            // Update the ongoing brawl in the manager
            brawlManager.updateBrawl(guildId, players);
        }
    });


    collector.on('end', async (collected: { size: number; }) => {
        if (counterMessage) await counterMessage.delete().catch(console.error);
    });
}

async function hasRole(member: GuildMember, roleName: string): Promise<boolean> {
    return member.roles.cache.some((role: { name: string; }) => role.name === roleName);
}
