declare module 'mars-simple-mongodb' {
    export function findEntryByID(collectionName: string, guildId: string, userId: string): Promise<any>;
    export function incrementFields(collectionName: string, guildId: string, userId: string, fields: Record<string, number>): Promise<void>;
    export function findDocuments(collectionName: string, documentId: string): Promise<any>;
    export function saveDocument(collectionName: string, document: any): Promise<void>;
    export function updateDocument(dbType: string, collectionName: string, query: Record<string, any>, update: Record<string, any>): Promise<boolean>;
    export function saveEntry(dbType: string, collection: string, entry: any): Promise<void>;
}
