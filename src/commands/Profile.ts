// import { Command } from "@jiman24/slash-commandment";

import { SlashCommandBuilder,CommandInteraction, InviteGuild } from "discord.js";import { Chest } from "../classes/Armor";
import { Dragon } from "../classes/Pet";
import { Player } from "../classes/Player";
import { Rage } from "../classes/Skill";
import { Sword } from "../classes/Weapon";
import { saveEntry, findEntryByID} from '../utils/db';


module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('sample'),
	async execute(i:CommandInteraction) {
        const target = i.user;
        const guild = i.guildId ?i.guildId:''

        const player = await Player.createInstance(i.user,guild);
        player.skill = new Rage();

        const pet = new Dragon();
        pet.setOwner(player);

        const chest = new Chest();
        player.equipArmor(chest);

        const sword = new Sword();
        player.equipWeapon(sword);
        
        i.reply({ embeds: [player.show()] });
    }
}

// export default class extends Command {
//   name = "profile";
//   description = "sample";
//   aliases = ["p"];

//   async exec(i: CommandInteraction) {

//     const player = new Player(i.user);
//     player.skill = new Rage();

//     const pet = new Dragon();
//     pet.setOwner(player);

//     const chest = new Chest();
//     player.equipArmor(chest);

//     const sword = new Sword();
//     player.equipWeapon(sword);
    
//     i.reply({ embeds: [player.show()] });
//   }
// }
