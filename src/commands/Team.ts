// import { Command } from "@jiman24/slash-commandment";

import { SlashCommandBuilder,CommandInteraction, GuildTextBasedChannel } from "discord.js";
import { Fighter } from "../classes/Fighter";
import { TeamBattle } from "../classes/TeamBatle";


module.exports = {
	data: new SlashCommandBuilder()
		.setName('team')
		.setDescription('sample'),
	async execute(i:CommandInteraction) {
    const teamA = { 
      name: "Jaegerist", 
      fighters: [new Fighter("eren"), new Fighter("mikasa")],
    }

    const teamB = {
      name: "Anti-Jaegerist",
      fighters: [new Fighter("jean"), new Fighter("annie")],
    }
    if(i.channel != null){
      const battle = new TeamBattle(i.channel as GuildTextBasedChannel, teamA, teamB);

      await battle.run();
}
  }
}

// export default class extends Command {
//   name = "team";
//   description = "sample";

//   async exec(i: CommandInteraction) {

//     const teamA = { 
//       name: "Jaegerist", 
//       fighters: [new Fighter("eren"), new Fighter("mikasa")],
//     }

//     const teamB = {
//       name: "Anti-Jaegerist",
//       fighters: [new Fighter("jean"), new Fighter("annie")],
//     }

//     const battle = new TeamBattle(i, teamA, teamB);

//     await battle.run();
//   }
// }
