export class SpecialPlayers {
    private static players: { [key: string]: string } = {
        "_tzi_": "⚡️",
        "sammyp.kongz.eth": "🃏",
        "salty_d3xter": "🎩",
        "arian3723": "<:pepeking:1192446095813529642>",
        "vatos79": "<:doom:1192446859273318511>",
        "punisher251": "😬",
        "jox1767": "<:viking:1192277555001176164>",
        "martindude": "<:viking:1192277555001176164>",
    };

    /** Get special icon for a player */
    static getIcon(username: string): string {
        return SpecialPlayers.players[username] || '👤';
    }

    /** Add or update a special player */
    static addPlayer(username: string, icon: string): void {
        SpecialPlayers.players[username] = icon;
    }

    /** Remove a special player */
    static removePlayer(username: string): void {
        delete SpecialPlayers.players[username];
    }

    /** Get all special players */
    static getAll(): { [key: string]: string } {
        return { ...SpecialPlayers.players };
    }
}
