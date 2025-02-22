class GameManager {
    private static instance: GameManager | null;
    private runingGames: Map<string, any>;

    private constructor();

    static getInstance(): GameManager;

    addGame(game: any, gameType: string): void;
    removeGame(game: any): void;
    getGame(id: string): any;
    getGames(): Map<string, any>;
}

declare const gameManager: GameManager;
export { gameManager, GameManager };