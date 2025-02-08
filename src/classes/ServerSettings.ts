import { CommandInteraction, GuildMember, Role } from 'discord.js';
import { findDocuments } from 'mars-simple-mongodb';

export class ServerSettings {
    fee: number;
    embedColor: string;
    brawlIcon: string;
    maxPlayers: number;
    battleSpeed: number;
    prize: string;
    waitTime: number;
    useMischief: boolean;
    autoJoinHP: number;
    roleBonus: Record<string, number>;

    constructor(data: any = {}) {
        this.fee = data.fee || 1;
        this.embedColor = data.embedcolor || '0x2f3136';
        this.brawlIcon = data.brawlicon || "https://cdn.discordapp.com/attachments/980341286718558248/1092769990639353857/Mega-Armoured-Trial2.jpg";
        this.maxPlayers = data.maxPlayers || 30;
        this.battleSpeed = data.battleSpeed || 2000;
        this.prize = data.prize || 'fee * players';
        this.waitTime = data.waitTime || 90000;
        this.useMischief = data.useMischief || false;
        this.autoJoinHP = data.autoJoinHP || 80;
        this.roleBonus = data.roleBonus || {};
    }

    static async fetch(interaction: CommandInteraction, guildId: string): Promise<ServerSettings> {
        const serverSettingsDocument = await findDocuments("brawl", guildId);
        const serverSettings = serverSettingsDocument[0] || {};
        const settings = new ServerSettings(serverSettings);

        // Apply command options
        const leadTimeOption = interaction.options.get('lead_time');
        const useMischiefOption = interaction.options.get('use_mischief');

        if (leadTimeOption?.value && typeof leadTimeOption.value === 'number') {
            settings.waitTime = leadTimeOption.value * 60000;
        }
        if (useMischiefOption?.value !== undefined && typeof useMischiefOption.value === 'boolean') {
            settings.useMischief = useMischiefOption.value;
        }

        return settings;
    }

    /**
     * Calculates a player's total health based on base HP and role bonuses.
     * @param member The Discord guild member to check roles for.
     * @returns The total health value.
     */
    calculatePlayerRoleBonus(member: GuildMember): number {
        let bonusHP: number = 0;

        member.roles.cache.forEach((role: Role) => {
            if (role.name in this.roleBonus) {
                bonusHP += this.roleBonus[role.name];
            }
        });

        return bonusHP;
    }
}
