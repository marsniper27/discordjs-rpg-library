//InteractiveBrawl.ts

import { SlashCommandBuilder, Message, MessageComponentInteraction, ButtonInteraction, CommandInteractionOptionResolver, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, User, Options, Role } from 'discord.js';
import { findEntryByID, incrementFields, findDocuments } from "mars-simple-mongodb";
import { evaluate } from 'mathjs';
import { v4 as uuidv4 } from 'uuid';
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
    )
    .addStringOption((option: any) =>
        option.setName('mentions')
            .setDescription('Mention users and roles (separated by spaces)')
    );

export async function execute(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    if (!interaction.guild) return;
    const guildId = interaction.guildId;

    if (!guildId || !interaction.inGuild()) {
        await interaction.editReply({ content: 'This command can only be used in a server.' });
        return;
    }
    if (!interaction.channel) {
        await interaction.editReply({ content: 'This command can only be used in a channel.' });
        return;
    }
    const id = uuidv4();
    const settings = await ServerSettings.fetch(interaction, guildId);

    // Create trackers for the players and the players who have joined
    // const players: Player[] = []; // This will hold the Player instances
    // let playerjoined = ''; // Track which players have joined
    const brawlStarter = interaction.user;
    const mentionedUsers = new Set<string>(); // Store unique user IDs
    const mentionString = (interaction.options as CommandInteractionOptionResolver).getString('mentions') || '';


    const brawlEmbed = new EmbedBuilder()
        .setTitle('Gargoyle Brawl')
        .setDescription('The brawl is about to begin! Prepare yourself.')
        .addFields([
            {
                name: `Countdown Time:`,
                value: `${settings.waitTime}`,
            },
            {
                name: `Id:`,
                value: `${id}`,
            },
        ])
        .setColor(parseInt(settings.embedColor, 16))
        .setThumbnail(settings.brawlIcon); // Replace with your actual image URL

    const joinButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`join_brawl_${id}`)
                .setLabel('---> Join <---')
                .setStyle(ButtonStyle.Success),
        );

    await interaction.editReply({ embeds: [brawlEmbed]});

    //this message is where the players list is added as they join
    let playermessage = await interaction.channel.send(`😈`);
    const countdownMessage = await interaction.channel.send(`...`);
    brawlManager.createBrawl(id, interaction, settings, playermessage, countdownMessage);

    if (mentionString) {
        const mentionMatches = mentionString.match(/<@!?(\d+)>|<@&(\d+)>/g) || [];

        for (const mention of mentionMatches) {
            const userIdMatch = mention.match(/<@!?(\d+)>/);
            const roleIdMatch = mention.match(/<@&(\d+)>/);
            // console.log(userIdMatch, roleIdMatch);

            if (userIdMatch) {

                mentionedUsers.add(userIdMatch[1]); // Add user ID
            } else if (roleIdMatch) {
                const role = await interaction.guild?.roles.fetch(roleIdMatch[1]);
                if (role) {
                    const membersWithRole = (await interaction.guild.members.fetch()).filter((member: GuildMember) =>
                        member.roles.cache.has(role.id)
                    );

                    membersWithRole.forEach((member: GuildMember) => mentionedUsers.add(member.user.id));
                }
            }
        }

        // **Convert User IDs to Player Instances**
        for (const userId of mentionedUsers) {
            const user = await interaction.guild?.members.fetch(userId);
            if (!user) continue;

            const brawl = brawlManager.getBrawl(id);
            if (!brawl) continue;

            const player = await createPlayer(user, guildId, brawl.players, settings, interaction);
            if (!player) continue;

            console.log(`Adding mentioned user: ${user.user.username} to the brawl`);
            // Add player to the brawl message
            await addtoBrawl(id, player, settings, playermessage);
        }
    }

    const buttonMessage = await interaction.editReply({ components: [joinButton] });

    // Setup a collector or listener for button interaction
    const filter = (i: MessageComponentInteraction) => {
        const customIdPattern = /^join_brawl_(.+)$/;
        const match = i.customId.match(customIdPattern);
        return !!match && i.user.id !== interaction.client.user?.id;
    };
    const collector = buttonMessage.createMessageComponentCollector({ filter, time: settings.waitTime });
    // const collector = interaction.channel.createMessageComponentCollector({ filter, time: settings.waitTime }); // Adjust time as necessary


    collector.on('collect', async (i: MessageComponentInteraction) => {
        if(!i) return;
        const customIdPattern = /^join_brawl_(.+)$/;
        const match = i.customId.match(customIdPattern);
        if (!match) return;
        
        const gameId = match[1]; // Extract the game ID from the custom ID
        console.log(`Brawl id: ${gameId} collected a button interaction`);
        
        const member = i.member as GuildMember;
        if (!member) return;

        if (!i.deferred && !i.replied) {
            await i.deferReply({ ephemeral: true });
        }
        
        if (i.customId === `join_brawl_${gameId}`) {
            const brawl = brawlManager.getBrawl(gameId);
            if (!brawl) {
                i.editReply({ content: 'This brawl no longer exists.' });
                return;
            }

            if (brawl.players.length >= settings.maxPlayers) {
                i.editReply({ content: 'The brawl is already full!' });
                return;
            }

            const player = await createPlayer(member, guildId, brawl.players, settings, i);
            if (!player) return;
            // Add player to the brawl
            // brawl.players.push(player);
            // Add player to the brawl message
            await addtoBrawl(gameId, player, settings, playermessage);

        }
        else {
            i.editReply({ content: 'Invalid button interaction!' });
        }
    });


    collector.on('end', async (collected: { size: number; }) => {
        console.log(`Brawl with id: ${id} collector ended`);
        if (counterMessage) await counterMessage.delete().catch(console.error);
    });
}

async function hasRole(member: GuildMember, roleName: string): Promise<boolean> {
    return member.roles.cache.some((role: { name: string; }) => role.name === roleName);
}

async function createPlayer(member: GuildMember, guildId: string, players: Player[], settings: ServerSettings, i: CommandInteraction | MessageComponentInteraction): Promise<Player | null> {
    console.log(`i is of type: ${i.constructor.name}`);
    console.log(`message deffered:`, i.deferred)

    const user = member.user;
    if (players.find(player => player.name === user.username)) {
        if (i.constructor.name == 'ButtonInteraction') {
            console.log('Already joined');
            await i.editReply({ content: `You have already joined the brawl!` });
        }
        return (null);
    }

    const playerData = await findEntryByID("users", guildId, user.id);
    let player;

    const playerHealth = 100 + settings.calculatePlayerRoleBonus(member as GuildMember);

    if (playerData) {
        if (playerData.coins < settings.fee) {
            if (i.constructor.name == 'ButtonInteraction') {
                console.log('Not enough coins');
                await i.editReply({ content: "You do not have enough coins to join!" });
            }
            return (null);
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

        if (i.constructor.name == 'ButtonInteraction') {
            console.log('Joined');
            if (!i.deferred && !i.replied) {
                await i.deferReply({ ephemeral: true });
            }
            await i.editReply({ content: `You joined the Brawl  --${playerHealth}` });
        }

    } else {
        player = await Player.createInstance(user, guildId);
        player.skill = settings.useMischief ? new Mischief() : undefined;

        if (i.constructor.name == 'ButtonInteraction') {
            console.log('First time joined');
            if (!i.deferred && !i.replied) {
                await i.deferReply({ ephemeral: true });
            }
            await i.editReply({ content: `Welcome to your first Brawl ${user.username}` });
        }
    }
    const playerIcon = SpecialPlayers.getIcon(user.username);
    player.icon = playerIcon;

    return player;
}

async function addtoBrawl(id: string, player: Player, settings: ServerSettings, playermessage: Message) {
    const brawl = brawlManager.getBrawl(id);
    if (!brawl) return;

    const players = brawl.players;
    console.log(`current players: ${players.map(player => player.name)}`);
    console.log(`Adding player: ${player.name} to the brawl`);
    players.push(player);
    console.log(`updated players: ${players.map(player => player.name)}`);
    let playerjoined = brawl.players.map(player => `${player.icon}  **${player.name}**`).join('\n');
    console.log(`playerjoined: ${playerjoined}`);

    
    // playerjoined += `${specialPlayers[user.username] || '👤'}  **${user.username}**\n`;
    let playercounttext;
    console.log(`brawl.players.length: ${brawl.players.length}`);
    if (brawl.players.length > 10) {
        playercounttext = `\n**🔥🔥 ${brawl.players.length}/${settings.maxPlayers} players!! 🔥🔥**\n`;
    } else {
        playercounttext = `\n**${brawl.players.length}/${settings.maxPlayers} players.**\n`;
    }

    // Update the player list message
    await brawl.playerMessage.edit({ content: `**The following players have joined the Brawl:**\n\n ${playerjoined}${playercounttext}` });
    // Update the ongoing brawl in the manager


    brawlManager.updateBrawl(id, players);
}