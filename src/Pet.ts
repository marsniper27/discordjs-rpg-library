import { oneLine } from "common-tags";
import { MessageEmbed } from "discord.js";
import { Player } from "./Player";
import { bold, BROWN, formatPercent, inlineCode, random } from "./utils";


export class Pet {
  name: string;
  owner?: Player;
  interceptRate = 0.05;
  attack = 5;

  constructor(name: string) {
    this.name = name;
  }

  isIntercept() {
    return random().bool(this.interceptRate);
  }

  show() {

    const interceptRate = formatPercent(this.interceptRate);

    const embed = new MessageEmbed()
      .setTitle("Pet")
      .setColor(BROWN)
      .addField("Name", this.name, true)
      .addField("Intercept Rate", inlineCode(interceptRate), true)
      .addField("Attack", inlineCode(this.attack), true)

    return embed;
  }

  intercept(opponent: Player) {

    if (!this.owner) throw new Error("pet cannot attack without owner");

    const armorProtection = opponent.armor * this.attack;
    const damageDealt = this.attack - armorProtection;

    const embed = new MessageEmbed()
      .setTitle("Pet Interception")
      .setColor(BROWN)
      .setDescription(
        oneLine`${this.owner.name}'s ${this.name} attacks ${opponent.name} for
        ${bold(damageDealt)} damage!`
      );

    return embed;
  }
}