// import { Command } from "@jiman24/slash-commandment";
import { SlashCommandBuilder,CommandInteraction } from "discord.js";
import { Pet } from "../classes/Pet";
import { Player } from "../classes/Player";

class Dragon extends Pet {
  name = "drag";
  id = "drag";
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pet')
		.setDescription('sample'),
	async execute(i:CommandInteraction) {
      if (!i.guildId) {
        i.reply({ content: "This command can only be used in a server.", ephemeral: true });
        return;
      }

      await i.deferReply();

      const author = await Player.createInstance(i.user,i.guildId);
      const pet = new Dragon();
      pet.setOwner(author);
      pet.imageUrl = "https://cdn.discordapp.com/attachments/574852830125359126/863997311532007475/8edc1273be7f8b1c4be3d72af3358e9b.png";

      author.pet = pet;

      const petEmbed = pet.show();

      i.editReply({ embeds: [petEmbed] });
    }
}
// export default class extends Command {
//   name = "pet";
//   description: string = "sample";
//   aliases = [];

//   async exec(i: CommandInteraction) {
//     await i.deferReply();

//     const author = new Player(i.user);
//     const pet = new Dragon();
//     pet.setOwner(author);
//     pet.imageUrl = "https://cdn.discordapp.com/attachments/574852830125359126/863997311532007475/8edc1273be7f8b1c4be3d72af3358e9b.png";

//     author.pet = pet;

//     const petEmbed = pet.show();

//     i.editReply({ embeds: [petEmbed] });
//   }
// }
