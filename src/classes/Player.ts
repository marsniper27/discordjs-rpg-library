// Importing necessary modules and types
import { User } from "discord.js";
import { Fighter } from "./Fighter";
import { findEntryByID, saveEntry } from "../utils/db"; // Adjust the import path as necessary

// Defining the PlayerData interface
interface PlayerData {
  _id: string; // Assuming _id is used as the identifier in your database schema
  attack: number;
  hp: number;
  armor: number;
  critChance: number;
  critDamage: number;
  gamesPlayed:number;
  gamesWon: number;
  coins: number;
  supercoins: number;
  level: number;
  xp: number;
}

export class Player extends Fighter {
  user: User;

  private constructor(user: User, data: PlayerData) {
    super(user.username);
    this.user = user;
    this.id = user.id;
    this.attack = data.attack;
    this.hp = data.hp;
    this.armor = data.armor;
    this.critChance = data.critChance;
    this.critDamage = data.critDamage;
    this.gamesPlayed = data.gamesPlayed;
    this.gamesWon = data.gamesWon;
    this.imageUrl = this.user.displayAvatarURL();
    this.coins = data.coins;
    this.supercoins = data.supercoins;
    this.level = data.level;
    this.xp = data.xp;
  }

  // Factory method to asynchronously create a Player instance
  static async createInstance(user: User, guildId: string): Promise<Player> {
    const data = await findOrCreatePlayerData(user, guildId);
    return new Player(user, data);
  }
}

// Asynchronously finds or creates player data in the database
async function findOrCreatePlayerData(user: User, guildId: string): Promise<PlayerData> {
  let data = await findEntryByID('users', guildId, user.id); // Make sure the collection name and parameters are correct
  if (!data) {
    // Default values for a new player
    const defaults: PlayerData = {
      _id: user.id, // Use Discord user ID as the database document ID
      attack: 10,
      hp: 100,
      armor: 0.1,
      critChance: 0.3,
      critDamage: 1.2,
      gamesPlayed:0,
      gamesWon:0,
      coins: 10,
      supercoins: 0,
      level: 1,
      xp: 0,
    };
    await saveEntry('users', guildId, defaults); // Assuming the collection name is 'users' and saveEntry can handle this structure
    data = defaults;
  }
  return data;
}

// Usage example (e.g., in an async function):
// const player = await Player.createInstance(discordUser);
