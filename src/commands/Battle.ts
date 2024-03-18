import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { Chest } from "../classes/Armor";
import { Battle } from "../classes/Battle";
import { Dragon } from "../classes/Pet";
import { Player } from "../classes/Player";
import { Rage } from "../classes/Skill";
import { incrementFields } from "../utils/db"

module.exports = {
	data: new SlashCommandBuilder()
		.setName('battle')
		.setDescription('Initiates a battle with another player')
        .addUserOption(option => 
          option
            .setName("player")
            .setDescription("The player you want to fight")
            .setRequired(true)
        ),
	async execute(i: CommandInteraction) {
        // Ensure the command is used in a guild context
        if (!i.guildId) {
          i.reply({ content: "This command can only be used in a server.", ephemeral: true });
          return;
        }

        const author = await Player.createInstance(i.user, i.guildId);
        const opponent = i.options.getUser("player");

        if (!opponent) {
          throw new Error("Please mention your opponent(s)");
        }

        author.skill = new Rage();

        const pet = new Dragon();
        pet.setOwner(author);

        const chest = new Chest();
        author.equipArmor(chest);

        const opponentPlayer = await Player.createInstance(opponent, i.guildId);
        const battle = new Battle(i, [author, opponentPlayer]);
        try {
            await incrementFields('users', i.guildId, i.user.id, { gamesPlayed: 1 });
            await incrementFields('users', i.guildId, opponentPlayer.id, { gamesPlayed: 1 });
          
            const winner = await battle.run();
            await incrementFields('users', i.guildId, winner.id, { gamesWon: 1 });
        } catch (error) {
            console.error("Failed to update player stats", error);
            await i.followUp("There was an issue updating player stats. Please try again later.");
        }
    }
};

// export default class BattleCommand extends SlashCommandBuilder {
//   name = "battle";
//   description: string = "sample";
//   aliases = ["b"];

//   constructor() {
//     super();

//     this.addUserOption(option => 
//       option
//         .setName("player")
//         .setDescription("player you want to fight")
//         .setRequired(true)
//     )
//   }

//   async exec(i: CommandInteraction) {

//     const author = new Player(i.user);
//     const opponent = i.options.getUser("player");

//     if (!opponent)
//       throw new CommandError("Please mention your opponent(s)");

//     author.skill = new Rage();

//     const pet = new Dragon();
//     pet.setOwner(author);

//     const chest = new Chest();
//     author.equipArmor(chest);

//     const opponentPlayer = new Player(opponent);
//     const battle = new Battle(i, [author, opponentPlayer]);

//     await battle.run();
//   }
// }
