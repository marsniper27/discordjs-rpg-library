import { SlashCommandBuilder, CommandInteraction, EmbedBuilder,ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { Chest } from "../classes/Armor";
import { Battle } from "../classes/Battle";
import { Dragon } from "../classes/Pet";
import { Player } from "../classes/Player";
import { Rage } from "../classes/Skill";
import { incrementFields,findEntryByID } from "../utils/db"
import { string } from "random-js";
import { 
  RED_CIRCLE, 
  formatPercent, 
  GOLD, 
  inlineCode, 
  random, 
  GREEN_CIRLE,
} from "../classes/utils";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('global_battle')
		.setDescription('Initiates a battle with players from all servers'),
	async execute(i: CommandInteraction) {
    i.reply({ content: "Coming Soon.", ephemeral: true });
  //   const guildIds = client.guilds.cache.map(guild => guild.id);

  //   for(guild in guildIds){
  //     const serverInfo = await findEntryByID("global","servers",guild)

  //     const battleChannel = serverInfo.battleChannel;
      
  //     const embed = new EmbedBuilder()
  //     .setTitle("GLOBAL BATTLE!!!!")
  //     .setColor(GOLD)
  //     .setFields([
  //       { name: "Name", value: this.name },
  //     ])
      
  //     // Create a button for closing the ticket
  //     const closeButton = new ButtonBuilder()
  //         .setCustomId('close_ticket')
  //         .setLabel('Close Ticket')
  //         .setStyle(ButtonStyle.Danger);

  //     const row = new ActionRowBuilder().addComponents(closeButton);

  //     battleChannel.send({embeds:embed, components: [row],})

  //   }
  //   // Ensure the command is used in a guild context
  //   if (!i.guildId) {
      // i.reply({ content: "This command can only be used in a server.", ephemeral: true });
  //     return;
  //   }

  //   const author = await Player.createInstance(i.user, i.guildId);
  //   const opponent = i.options.getUser("player");

  //   if (!opponent) {
  //     throw new Error("Please mention your opponent(s)");
  //   }
  //   const battle = new Battle(i, [author, opponentPlayer]);
  //   try {
  //       await incrementFields('users', i.guildId, i.user.id, { gamesPlayed: 1 });
  //       await incrementFields('users', i.guildId, opponentPlayer.id, { gamesPlayed: 1 });
      
  //       const winner = await battle.run();
  //       await incrementFields('users', i.guildId, winner.id, { gamesWon: 1 });
  //   } catch (error) {
  //       console.error("Failed to update player stats", error);
  //       await i.followUp("There was an issue updating player stats. Please try again later.");
  //   }
  }
};