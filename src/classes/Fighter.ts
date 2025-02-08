// Fighter.ts
import { EmbedBuilder } from "discord.js";
import { Armor } from "./Armor";
import { Base } from "./Base";
import { Pet } from "./Pet";
import { Skill } from "./Skill";
import { 
  RED_CIRCLE, 
  formatPercent, 
  GOLD, 
  inlineCode, 
  random, 
  GREEN_CIRLE,
} from "./utils";
import { Weapon } from "./Weapon";
import {findEntryByID} from "mars-simple-mongodb"

/** 
 * Fighter is base class to be used in Battle. Only class derived from Fighter
 * can be used in Battle.
 *
 * ```typescript
 * class Monster extends Fighter {
 *    name = "boogy man";
 *    id = "boogy_man";
 *    attack = 20;
 * }
 * ```
 * */
export class Fighter {
  /** Fighter name */
  name: string;
  /** Fighter unique id */
  id: string;
  /** Damage dealt when attack */
  attack = 10;
  /** Fighter's health point */
  hp = 100;
  /** Amount of damage blocked when Fighter gets attacked*/
  naturalArmor = 0.1;
  /** Percentage to get critical attack */
  critChance = 0.3;
  /** Critical attack percentage increment */
  critDamage = 1.2;

  gamesPlayed =0;
  gamesWon=0;
  coins=10;
  superCoins=0;
  level=1;
  xp=0;
  /** Array of equipped armors */
  equippedArmors: Armor[] = [];
  /** Array of equipped weapons */
  equippedWeapons: Weapon[] = [];
  /** Fighter's Skill */
  skill?: Skill;
  /** Fighter's Pet */
  pet?: Pet;
  /** Image to represent this Fighter */
  imageUrl?: string;

  constructor(name: string) {
    // super();
    this.name = name;
    this.id = name;
  }

  /** Add new armor to the user */
  equipArmor(armor: Armor) {
    this.naturalArmor += armor.armor;
    this.equippedArmors.push(armor);
  }

  /** Add new weapon to the user */
  equipWeapon(weapon: Weapon) {
    this.attack += weapon.attack;
    this.equippedWeapons.push(weapon);
  }

  /** Returns true if critical attack */
  isCrit() {
    return random.bool(this.critChance);
  }

  /** 
   * MessageEmbed that represents this Fighter. Passing another Fighter in this
   * method will make comparison between this Fighter stat with the other 
   * */
  async show(guild:string, fighter?: Fighter) {
    const theme = await findEntryByID('theme','server',guild)
    const armor = formatPercent(this.naturalArmor);
    const critChance = formatPercent(this.critChance);

    const armorList = this.equippedArmors
      .map((x, i) => `${i + 1}. ${x.name}`)
      .join("\n");

    const weaponList = this.equippedWeapons
      .map((x, i) => `${i + 1}. ${x.name}`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("Profile")
      .setColor(GOLD)
      .setFields([
        { name: "Name", value: this.name },
        { name: `${theme.coinName?theme.coinName:'Copper'}`, value: inlineCode(Math.round(this.coins).toString()), inline: true },
        { name: `${theme.supercoinName?theme.supercoinName:'Gold'}`, value: inlineCode(Math.round(this.superCoins).toString()), inline: true },
        { name: "Level", value: inlineCode(`${this.level || 0}`), inline: true },
        { name: "XP", value: inlineCode(`${this.xp || 0}`), inline: true },
        { name: "Attack", value: inlineCode(Math.round(this.attack).toString()), inline: true },
        { name: "HP", value: inlineCode(Math.round(this.hp).toString()), inline: true },
        { name: "Armor", value: inlineCode(armor), inline: true },
        { name: "Crit Chance", value: inlineCode(critChance), inline: true },
        { name: "Crit Damage", value: inlineCode(`x${this.critDamage.toFixed(1)}`), inline: true },
        { name: "Skill", value: this.skill?.name || "none", inline: true },
        { name: "Pet", value: this.pet?.name || "none" },
        { name: "Armors", value: armorList || "none", inline: true },
        { name: "Weapons", value: weaponList || "none", inline: true },
        { name: '\u200B', value: '\u200B', inline: false },
        { name: "Games Played", value:inlineCode(`${this.gamesPlayed || 0}`), inline: true },
        { name: "Games Won", value: inlineCode(`${this.gamesWon || 0}`), inline: true },
      ])

    if (this.imageUrl)
      embed.setThumbnail(this.imageUrl);

    if (fighter) {

      const fields1  = ["attack", "hp"] as const;
      let i = 1;

      for (const field of fields1) {

        const monsterStat = this[field];
        const playerStat = fighter[field];
        let stat = monsterStat.toString();

        if (playerStat > monsterStat) {
          stat += ` ${GREEN_CIRLE}`;
        } else if (monsterStat > playerStat) {
          stat += ` ${RED_CIRCLE}`;
        }

        embed.data.fields![i].value = inlineCode(stat);

        i++;
      }

      const fields2 = ["naturalArmor", "critChance"] as const;
      for (const field of fields2) {

        const monsterStat = this[field];
        const playerStat = fighter[field];
        let stat = formatPercent(monsterStat);

        if (playerStat > monsterStat) {
          stat += ` ${GREEN_CIRLE}`;
        } else if (monsterStat > playerStat) {
          stat += ` ${RED_CIRCLE}`;
        }

        embed.data.fields![i].value = inlineCode(stat);

        i++;
      }


      const fields3 = ["critDamage"] as const;
      for (const field of fields3) {

        const monsterStat = this[field];
        const playerStat = fighter[field];
        let stat = `x${monsterStat.toFixed(1)}`;

        if (playerStat > monsterStat) {
          stat += ` ${GREEN_CIRLE}`;
        } else if (monsterStat > playerStat) {
          stat += ` ${RED_CIRCLE}`;
        }

        embed.data.fields![i].value = inlineCode(stat);

        i++;
      }
    }

    return embed;
  }
}
