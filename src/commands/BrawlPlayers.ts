// BrawlPlayers.ts
import { TextChannel, SlashCommandBuilder , Message, MessageComponentInteraction, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, GuildMember, User, Options } from 'discord.js';
// import { findEntryByID,incrementFields } from '../utils/db';
import { findEntryByID, incrementFields } from "mars-simple-mongodb"; // Adjust the import path as necessary
import { Player } from '../classes/Player';
import { Battle } from '../classes/Battle';
import { Mischief } from '../classes/Skill';
import { random, bold, GOLD } from '../classes/utils'


const maxPlayers = 30;
const fee = 1; // Assuming a fee for joining the brawl
// Placeholder currency symbol
const currency = '$';
const battleSpeed = 2000;
// const waitTime = 90000; //90sec
let waitTime = 90000; // Default value
let minPlayers = 5;
const embedcolor = 0x2f3136;
const brawlicon = "https://cdn.discordapp.com/attachments/980341286718558248/1092769990639353857/Mega-Armoured-Trial2.jpg";

let counterMessage: Message | null = null;




let Responses90 = [
    `More time than normal... A Gargoyle must've been messing with time crystals again!\n\n ⏱**90 seconds to go** <@&956462114451640351>.`,
    `90sec, wow! Best hit that button early.\n\n ⏱**90 seconds to go** <@&956462114451640351>.`,
    `Sip your coffee, theres plenty of time left\n\n ⏱**90 seconds to go** <@&956462114451640351>.`,
];

let Responses60 = [
    `Twiddle your thumbs and whistle to the tune of violence.\n\n ⏱**60 seconds to go** <@&956462114451640351>.`,
    `Slap your cheeks and stretch your wings.\n\n ⏱**60 seconds to go** <@&956462114451640351>.`,
    `Take out your whetstone and throw it away. It'll be more fun with a blunt weapon.\n\n ⏱**60 seconds to go** <@&956462114451640351>.`,
    `Step on your neighbor's foot because that'll give you an advantage later on.\n\n ⏱**60 seconds to go** <@&956462114451640351>.`,
    `Stand around impatiently for the battle to start.\n\n ⏱**60 seconds to go** <@&956462114451640351>.`,
    `Kick your Narrator for good luck.\n\n ⏱**60 seconds to go** <@&956462114451640351>.`
];



let Responses30 = [
    `Let the sense of impending combat fuel your warrior instinct.\n\n ⏱**30 seconds to go.**`,
    `Close your eyes and let imaginary power course through your veins. Who knows, it might help.\n\n ⏱**30 seconds to go.**`,
    `Practice by trying to stab your neighbor with your favorite weapon.\n\n ⏱**30 seconds to go.**`,
    `Time has never before moved so slowly as you stay motionless, anticipating the big event.\n\n ⏱**30 seconds to go.**`,
    `Today is the day that you'll finally win. Right?\n\n ⏱**30 seconds to go.**`,
    `Wipe that saliva off your face! That <:ruin:985150753339494401> isn't yours yet.\n\n ⏱**30 seconds to go.**`
];


let Responses10 = [
    `That's enough practice; take up positions.\n\n ⏱**10 seconds to go.**`,
    `Step into the arena or be left standing at the sidelines watching your friends have fun.\n\n ⏱**10 seconds to go.**`,
    `With high hopes and an empty stomach, you stand in the arena and mentally turn friend to foe.\n\n ⏱**10 seconds to go.**`,
    `Suddenly time is going really fast for anyone who wants to join and is on their way here.\n\n ⏱**10 seconds to go.**`,
    `⏱**10 seconds to go**\n\n 10. 9. 8. 7. 6. 5. Hey! Read slower! 4. 3. 2. 1.`,
    `Grin menacingly and look around to strike fear into the other contestants.\n\n ⏱**10 seconds to go.**`,
];


export const data:any = new SlashCommandBuilder ()
    .setName('brawl_players')
    .setDescription('All in - Last one standing wins!')
    .addNumberOption((option: any) =>
        option.setName('min_players')
            .setDescription('Number of players required before starting countdown')
            .setRequired(true))
        
    .addNumberOption((option: any) =>
        option.setName('lead_time')
            .setDescription('Countdown time before brawl starts in minutes (default is 1.5mins)'))
    .addBooleanOption((option: any) =>
        option.setName('use_mischief')
            .setDescription('Enable mischief'));

export async function execute(interaction: CommandInteraction): Promise<void> {
    if (!interaction.guildId || !interaction.inGuild()) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    if (!interaction.channel) {
        await interaction.reply({ content: 'This command can only be used in a channel.', ephemeral: true });
        return;
    }
    // Safely attempt to retrieve and use the boolean option value
    const minPlayersOption = interaction.options.get('min_players');
    const booleanOption = interaction.options.data.find((option: any) => option.name === 'use_mischief');
    const leadTimeOption = interaction.options.get('lead_time');
    if (minPlayersOption && typeof minPlayersOption.value === 'number') {
        minPlayers = minPlayersOption.value;
    }
    if (leadTimeOption && typeof leadTimeOption.value === 'number') {
        waitTime = leadTimeOption.value * 60000;
    }
    const useMischief = booleanOption ? booleanOption.value : false;
    const brawlStarter = interaction.user;
    const guildId = interaction.guildId;
    const players: Player[] = []; // This will hold the Player instances
    let playerjoined = ''; // Track which players have joined

    const brawlEmbed = new EmbedBuilder()
        .setTitle('Gargoyle Brawl')
        .setDescription('The brawl is about to begin! Prepare yourself.')
        .addFields([
             {
                name:'Minimum players',
                value:`${minPlayers}`
             },
              { 
                name: `Countdown Time:`,
                value: `${waitTime}`,
              },
            ])
        .setColor(0x2F3136)
        .setThumbnail(brawlicon); // Replace with your actual image URL

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

    // Setup a collector or listener for button interaction
    const filter = (i: MessageComponentInteraction) => i.customId === 'join_brawl' && i.user.id !== interaction.client.user?.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter}); // Adjust time as necessary

    collector.on('collect', async (i: { member: any; channel: any; customId: string; user: { fetch: () => any; }; reply: (arg0: { content: string; ephemeral: boolean; }) => void; }) => {
        // await i.deferReply({ephemeral: true} )
        if (!i.member) {
            console.log('member not found')
            return;
        }
        const member = i.member as GuildMember;
        const user = member.user;
        if (!i.channel) { return }
        if (i.customId === 'join_brawl') {
            const user = await i.user.fetch();
            if (players.find(player => player.name === user.username)) {
                i.reply({ content: 'You have already joined the brawl!',ephemeral:true})
                return;
            }
            const playerData = await findEntryByID("users", interaction.guildId, member.id)
            let player;
            //if user exists then join the game, if not create a user and then join
            if (playerData) {
                if (playerData.coins < fee) {
                    await i.reply({ content: "You do not have enough coins to join!",ephemeral:true});
                    return;
                }
                player = await Player.createInstance(user, guildId);
                player.coins -= fee;
                //reset player stats to 0 but dont save
                player.level = 1;
                player.xp = 0;
                player.hp = 100;
                player.attack = 10;
                player.naturalArmor = 0.1;
                player.critChance = 0.3;
                player.critDamage = 1.2;
                player.pet = undefined;
                player.skill = useMischief ? new Mischief() : undefined;
                i.reply({content:`You joined the Brawl`,ephemeral:true});
            } else {
                player = await Player.createInstance(user, guildId);
                player.skill = useMischief ? new Mischief() : undefined;
                i.reply({ content:`Welcome to your first Brawl ${user.username}`,ephemeral:true});
            }

            players.push(player); //adds player to the players list

            if (user.username == "_tzi_") {
                playerjoined += `⚡️  **${user.username}**\n`;

            } else if (user.username == "sammyp.kongz.eth") {
                playerjoined += `🃏  **${user.username}**\n`;

            } else if (user.username == "salty_d3xter") {
                playerjoined += `🎩  **${user.username}**\n`;

            } else if (user.username == "arian3723") {
                playerjoined += `<:pepeking:1192446095813529642>  **${user.username}**\n`;

            } else if (user.username == "vatos79") {
                playerjoined += `<:doom:1192446859273318511>  **${user.username}**\n`;

            } else if (user.username == "punisher251") {
                playerjoined += `😬  **${user.username}**\n`;

            } else if (user.username == "jox1767") {
                playerjoined += `<:viking:1192277555001176164>  **${user.username}**\n`;

            } else if (user.username == "martindude") {
                playerjoined += `<:viking:1192277555001176164>  **${user.username}**\n`;

            } else if (await hasRole(member, "Royal Brawl Society")) {
                playerjoined += `👑  **${user.username}**\n`;
            } else {
                playerjoined += `👤  **${user.username}**\n`;
            }


            //tzi
            let playercounttext;
            if (players.length > 10) {
                playercounttext = `\n**🔥🔥 ${players.length}/${maxPlayers} players!! 🔥🔥**\n`;
            } else {
                playercounttext = `\n**${players.length}/${maxPlayers} players.**\n`;
            }

            await playermessage.edit({ content: `**The following players have joined the Brawl:**\n\n ${playerjoined} \n\n ${playercounttext}`, components: [] });
            
            if (minPlayers !== null && players.length >= minPlayers) {

                startCountdown(interaction, players, playermessage, collector , waitTime);

            }
        }
    });

    collector?.on('end', async (collected: { size: number; }) => {
        if (counterMessage) await counterMessage.delete().catch(console.error);
        await interaction.editReply({ components: [] })
        // Handle the end of the collection period, e.g., start the brawl with the collected players
        // This might involve checking if enough players have joined, initializing a Battle instance, etc.

        // Example end handling (placeholder)
        if (collected.size < minPlayers) { // Adjust according to your minimum players requirement
            interaction.editReply({ components: [] })
            const embed3 = new EmbedBuilder()
                .setTitle(`Narrator: Well that was disappointing...`)
                .setColor(0x2f3136)
                .setThumbnail("https://cdn.discordapp.com/attachments/969609321610637392/1093501354485485588/haha.jpg")
                .setDescription(
                    `${brawlStarter} tried to start a brawl, but nobody showed up! 🤣`
                );

            await interaction.followUp({ embeds: [embed3] });
            return;
        } else {

            await interaction.followUp({ content: "The brawl begins!", ephemeral: true });
            if(interaction.channel != null){
                const battle = new Battle(interaction.channel, random.shuffle(players));
                //-----set battle speed-----
                battle.setInterval(battleSpeed);
                //--------------------------
                const winner = await battle.run();

                const reward = fee * players.length;

                const embed2 = new EmbedBuilder()
                    .setColor(GOLD)
                    .setTitle(`${winner.name} IS THE WINNER!`)
                    .setDescription(`Out of ${players.length} players, ${bold(winner.name)} won the Brawl and walked away with ${reward} ${currency}!`);
                await interaction.followUp({ embeds: [embed2] });
                try {
                    for (const brawler of players) {
                        await incrementFields('users', interaction.guildId, brawler.id, { gamesPlayed: 1 });
                        await incrementFields('users', interaction.guildId, brawler.id, { coins: -fee });
                    }
                    await incrementFields('users', interaction.guildId, winner.id, { gamesWon: 1 });
                    await incrementFields('users', interaction.guildId, winner.id, { coins: reward });
                } catch (error) {
                    console.error("Failed to update player stats", error);
                    await interaction.followUp("There was an issue updating player stats. Please try again later.");
                }
            }
        }
    });




};

async function startCountdown(interaction: CommandInteraction, players: Player[], playermessage: Message, collector: any, countdownTime: number) {
    if (!interaction.channel) {
        await interaction.reply({ content: 'This command can only be used in a channel.', ephemeral: true });
        return;
    }

    let timeLeft = countdownTime / 1000;
    var jump = playermessage.url;

    const Response90 = Math.floor(Math.random() * Responses90.length);
    const Response60 = Math.floor(Math.random() * Responses60.length);
    const Response30 = Math.floor(Math.random() * Responses30.length);
    const Response10 = Math.floor(Math.random() * Responses10.length);

    const channel = interaction.channel as TextChannel
    const countdownMessage = await channel.send(`${timeLeft} seconds remaining`);

    const countdown = setInterval(async () => {
        timeLeft--;

        if (timeLeft <= 0) {
            clearInterval(countdown);
            await countdownMessage.edit("Time's Up!");
            collector.stop();
        } else {
            if (waitTime == 90000) {
                setTimeout(async () => {
                    const embed5 = new EmbedBuilder()
                        .setColor(embedcolor)
                        .setAuthor({ name: `Someone is trying to start a brawl!` })
        
                        // .setTitle("Brawl")
                        .setThumbnail(brawlicon)
                        //      .setDescription(`You have 60sec to join`);
                        .setDescription(`${Responses90[Response90]}`)
                        .addFields({ name: `[JOIN THE BRAWL]`, value: `${jump}` });
        
                    await updateCounterMessage(interaction,[embed5]);
                    //	msg.channel.send("Brawl starts in 60sec")
                }, (waitTime - 90000));
            }
        
            if (waitTime == 60000) {
                setTimeout(async () => {
                    // if(counterMessage) await counterMessage.delete().catch(console.error);
                    const embed5 = new EmbedBuilder()
                        .setColor(embedcolor)
                        .setAuthor({ name: `Someone is trying to start a brawl!` })
        
                        // .setTitle("Brawl")
                        .setThumbnail(brawlicon)
                        //      .setDescription(`You have 60sec to join`);
                        .setDescription(`${Responses60[Response60]}`)
                        .addFields({ name: `[JOIN THE BRAWL]`, value: `${jump}` });
        
                    await updateCounterMessage(interaction,[embed5]);
                    //	msg.channel.send("Brawl starts in 60sec")
                }, (waitTime - 60000));
            }
        
            if (waitTime == 30000) {
                setTimeout(async () => {
                    // if(counterMessage) await counterMessage.delete().catch(console.error);
                    const embed5 = new EmbedBuilder()
                        .setColor(embedcolor)
                        .setAuthor({ name: `Someone is trying to start a brawl!` })
        
                        // .setTitle("Brawl")
                        .setThumbnail(brawlicon)
                        //      .setDescription(`...30sec left to join`);
                        .setDescription(`${Responses30[Response30]}`)
                        .addFields({ name: `[JOIN THE BRAWL]`, value: `${jump}` });
        
                    await updateCounterMessage(interaction,[embed5]);
        
                    //	msg.channel.send("Brawl starts in 30sec")
                }, (waitTime - 30000));
            }
        
            if (waitTime == 10000) {
                setTimeout(async () => {
                    // if(counterMessage) await counterMessage.delete().catch(console.error);
                    const embed5 = new EmbedBuilder()
                        .setColor(embedcolor)
                        .setAuthor({ name: `Someone is trying to start a brawl!` })
        
                        // .setTitle("Brawl")
                        .setThumbnail(brawlicon)
                        //      .setDescription(`...10sec left to join!`);
                        .setDescription(`${Responses10[Response10]}`)
                        .addFields({ name: `[JOIN THE BRAWL]`, value: `${jump}` });
        
                    await updateCounterMessage(interaction,[embed5]);
        
                    //	msg.channel.send("Brawl starts in 10sec")
                }, (waitTime - 10000));
            }
            await countdownMessage.edit(`${timeLeft} seconds remaining`);
        }
    }, 1000);
}


async function updateCounterMessage(interaction:CommandInteraction, embed: EmbedBuilder[]) {
    if (!counterMessage) {
        // If counterMessage does not exist, send a new message and assign it to counterMessage
        counterMessage = await interaction.followUp({ embeds: embed, fetchReply: true }) as Message;
    } else {
        // If counterMessage exists, edit it with the new embeds
        await counterMessage.edit({ embeds: embed });
    }
}

async function hasRole(member: GuildMember, roleName: string): Promise<boolean> {
    return member.roles.cache.some((role:any) => role.name === roleName);
}

