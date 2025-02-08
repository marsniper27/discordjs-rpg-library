// BrawlManager.ts
import { CommandInteraction, EmbedBuilder, GuildTextBasedChannel, Message } from 'discord.js';
import { evaluate } from 'mathjs';
import { Player } from '../classes/Player';
import { Battle } from '../classes/Battle';
import { bold, GOLD, random } from '../classes/utils';
import { ServerSettings } from '../classes/ServerSettings';
import { incrementFields } from 'mars-simple-mongodb';

class BrawlManager {
    private static instance: BrawlManager;
    private ongoingBrawls: Map<string, { interaction: CommandInteraction, players: Player[], battle: Battle | null, timeout: NodeJS.Timeout | null, settings: ServerSettings, playerMessage: Message, countdownMessage?: Message }> = new Map();

    private constructor() { }

    public static getInstance(): BrawlManager {
        if (!BrawlManager.instance) {
            BrawlManager.instance = new BrawlManager();
        }
        return BrawlManager.instance;
    }

    public createBrawl(interaction: CommandInteraction, guildId: string, players: Player[], settings: ServerSettings, playerMessage: Message, countdownMessage?: Message): { interaction: CommandInteraction, players: Player[], battle: Battle | null, timeout: NodeJS.Timeout | null, settings: ServerSettings, playerMessage: Message, countdownMessage?: Message } {
        let timeLeft = settings.waitTime / 1000;
        let timeout: NodeJS.Timeout | null = null;
        if (countdownMessage) {
            countdownMessage.edit(`${timeLeft} seconds remaining`);

            timeout = setInterval(() => {
                timeLeft--;
                countdownMessage.edit(`${timeLeft} seconds remaining`);
                if (timeLeft <= 0) {
                    clearInterval(brawl.timeout);
                    countdownMessage.edit("Time's Up!");
                    this.startBrawl(guildId);
                }
            }, 1000);
        }
        else {
            timeout = setTimeout(() => this.startBrawl(guildId), settings.waitTime);
        }



        const brawl = { interaction, players, battle: null, timeout, settings, playerMessage, countdownMessage };
        this.ongoingBrawls.set(guildId, brawl);
        return brawl;
    }

    public async startBrawl(guildId: string) {
        const brawl = this.ongoingBrawls.get(guildId);
        // console.log("brawlers:", brawl?.players)
        const currency = '$';


        if (brawl) {
            if (brawl.interaction.channel == null) return;
            const interaction = brawl.interaction;
            // Example end handling (placeholder)
            if (brawl.players.length < 2) { // Adjust according to your minimum players requirement
                interaction.editReply({ components: [] })
                const embed3 = new EmbedBuilder()
                    .setTitle(`Narrator: Well that was disappointing...`)
                    .setColor(0x2f3136)
                    .setThumbnail("https://cdn.discordapp.com/attachments/969609321610637392/1093501354485485588/haha.jpg")
                    .setDescription(
                        `${interaction.user} tried to start a brawl, but nobody showed up! 🤣`
                    );

                await interaction.followUp({ embeds: [embed3] });
                // End the brawl in the manager
                brawlManager.endBrawl(guildId);
                return;
                // await interaction.followUp({ content: "Not enough players joined the brawl.", ephemeral: true });
            } else {
                // Start the brawl here
                console.log(`Starting brawl in guild: ${guildId}`);

                await interaction.followUp({ content: "The brawl begins!", ephemeral: true });
                // const battle = new Battle(interaction, random.shuffle(players));
                if (interaction.channel != null) {

                    if(brawl.players.length > brawl.settings.maxPlayers){
                        const randomizedPlayers = random.shuffle(brawl.players);
                        brawl.players = randomizedPlayers.slice(0, brawl.settings.maxPlayers);
                        interaction.followUp(`The brawl is full! ${brawl.settings.maxPlayers} random players will enter the areana.`);
                    }

                    // Example: create a new battle instance
                    brawl.battle = new Battle(interaction.channel as GuildTextBasedChannel, random.shuffle(brawl.players));
                    this.ongoingBrawls.set(guildId, brawl); // Explicitly update the map
                    const settings = brawl.settings;
                    //-----set battle speed-----
                    brawl.battle.setInterval(settings.battleSpeed);
                    //--------------------------
                    const winner = await brawl.battle.run();

                    const variables = {
                        fee: settings.fee,
                        players: brawl.players.length
                    };
                    // Evaluate the expression safely
                    try {
                        console.log("Prize:", settings.prize); // Output depends on expression
                        console.log("Variables:", variables); // Output depends on expression
                        const reward = evaluate(settings.prize, variables);
                        console.log("Reward:", reward); // Output depends on expression
                        const embed2 = new EmbedBuilder()
                            .setColor(GOLD)
                            .setTitle(`${winner.name} IS THE WINNER!`)
                            //      .setTitle("Narrator")
                            .setDescription(`Out of ${brawl.players.length} players, ${bold(winner.name)} won the Brawl and walked away with ${reward} ${currency}!`);
                        //      .appendDescription(`\n*Psst ${msg.author.toString()}*`);
                        await interaction.followUp({ embeds: [embed2] });
                        try {
                            for (const brawler of brawl.players) {
                                await incrementFields('users', guildId, brawler.id, { gamesPlayed: 1 });
                                await incrementFields('users', guildId, brawler.id, { coins: -settings.fee });
                            }
                            await incrementFields('users', guildId, winner.id, { gamesWon: 1 });
                            await incrementFields('users', guildId, winner.id, { coins: reward });
                        } catch (error) {
                            console.error("Failed to update player stats", error);
                            await interaction.followUp("There was an issue updating player stats. Please try again later.");
                        }
                    } catch (error: any) {
                        console.error("Invalid expression:", error.message);
                    }
                }
            }
        }
    }


    public endBrawl(guildId: string): void {
        const brawl = this.ongoingBrawls.get(guildId);
        if (brawl) {
            clearTimeout(brawl.timeout!);
            this.ongoingBrawls.delete(guildId);
        }
    }

    public getBrawl(guildId: string) {
        return this.ongoingBrawls.get(guildId);
    }

    public updateBrawl(guildId: string, newPlayers: Player[]) {
        const brawl = this.getBrawl(guildId);
        if (brawl) {
            brawl.players = newPlayers;
            this.ongoingBrawls.set(guildId, brawl); // Explicitly update the map
        }
    }

    public updateBrawlWaitTime(guildId: string, newWaitTime: number): void {
        const brawl = this.getBrawl(guildId);
        if (brawl && brawl.countdownMessage) {
            console.log('Updating wait time for brawl in guild:', guildId);

            if (brawl.timeout) {
                console.log('Clearing old timeout');
                clearTimeout(brawl.timeout); // Clear the old timeout
                clearInterval(brawl.timeout);
            }

            let timeLeft = newWaitTime / 1000;
            brawl.countdownMessage!.edit(`${timeLeft} seconds remaining`);

            const interval = setInterval(() => {
                timeLeft--;
                brawl.countdownMessage!.edit(`${timeLeft} seconds remaining`);
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    brawl.countdownMessage!.edit("Time's Up!");
                    this.startBrawl(guildId);
                }
            }, 1000);

            brawl.timeout = interval;
            this.ongoingBrawls.set(guildId, brawl); // Explicitly update the map
        }
    }

    // Method to refresh/update the brawl state
    public refreshBrawlState(guildId: string) {
        const brawl = this.getBrawl(guildId);
        if (brawl) {
            // Trigger game state refresh or handle the game logic (such as recalculating players, timers, etc.)
            console.log(`Refreshing state for brawl in guild: ${guildId}`);
            // Example: recheck players or update battle state
            this.updateBrawl(guildId, brawl.players); // Update player list (if needed)
        }
    }

}

export const brawlManager = BrawlManager.getInstance();
