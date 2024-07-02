// import { Command } from "@jiman24/slash-commandment";

import { SlashCommandBuilder,CommandInteraction, GuildTextBasedChannel } from "discord.js";
import { Chest } from "../classes/Armor";
import { Battle } from "../classes/Battle";
import { Dragon } from "../classes/Pet";
import { Player } from "../classes/Player";
import { Rage } from "../classes/Skill";
import { Fighter } from "../classes/Fighter";


module.exports = {
	data: new SlashCommandBuilder()
		.setName('raid')
		.setDescription('sample'),
	async execute(i:CommandInteraction) {

    if (!i.guildId) {
      i.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const author = await Player.createInstance(i.user,i.guildId);
    const bots = [
      new Fighter("Michael"),
      new Fighter("Mansion"),
      new Fighter("John"),
    ];

    const boss = new Fighter("Boogey Man");
    boss.hp = 1000;
    boss.attack = 50;
    boss.critChance = 0.4;

    author.skill = new Rage();

    const pet = new Dragon();
    pet.setOwner(author);

    const chest = new Chest();
    author.equipArmor(chest);

    if(i.channel != null){
      const battle = new Battle(i.channel as GuildTextBasedChannel, [author, boss, ...bots]);

      battle.setBoss(boss);

      await battle.run();
    }

    }
}


// export default class extends Command {
//   name = "raid";
//   description: string = "sample";

//   async exec(i: CommandInteraction) {

//     const author = new Player(i.user);
//     const bots = [
//       new Fighter("Michael"),
//       new Fighter("Mansion"),
//       new Fighter("John"),
//     ];

//     const boss = new Fighter("Boogey Man");
//     boss.hp = 1000;
//     boss.attack = 50;
//     boss.critChance = 0.4;

//     author.skill = new Rage();

//     const pet = new Dragon();
//     pet.setOwner(author);

//     const chest = new Chest();
//     author.equipArmor(chest);

//     const battle = new Battle(i, [author, boss, ...bots]);

//     battle.setBoss(boss);

//     await battle.run();
//   }
// }
