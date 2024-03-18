import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';

dotenv.config();

// Construct the MongoDB URI using environment variables
const dbUri: string = process.env.MONGO_DB_ADDRESS || '';
const uri: string = dbUri.replace("<password>", process.env.MONGO_PASSWORD || '');
let client: MongoClient | null = null;

// Map to hold the instances of different databases
let dbInstances: Map<string, Db> = new Map();

// Initialize the MongoDB client
if (process.env.SKIP_DB_INIT !== 'true') {
    client = new MongoClient(uri);
}

// Connect to MongoDB and return the requested database instance
// dbType should be either "wallet" for the wallet database
// or the Discord server ID for server-specific databases
async function connectDB(dbType: string): Promise<Db> {
    if (!client) {
        throw new Error('MongoDB client not initialized.');
    }

    if (!dbInstances.has(dbType)) {
        await client.connect();
        const dbName = dbType === 'wallet' ? process.env.MONGO_DB_NAME || 'defaultDbName' : dbType;
        const dbInstance = client.db(dbName);
        dbInstances.set(dbType, dbInstance);
    }
    return dbInstances.get(dbType) as Db;
}

// Save a wallet entry in the database
async function saveEntry(dbType: string, collection: string, entry: any): Promise<void> {
    const db = await connectDB(dbType);
    const result = await db.collection(collection).insertOne(entry);
    if(dbType === 'wallet'){
        console.log(`New Wallet created for ${entry.user} with public key ${entry.publicKey}`);
    }
}

// Find a wallet by ID
async function findEntryByID(dbType: string, collection: string, id: any): Promise<any | false> {
    const db = await connectDB(dbType);
    const result = await db.collection(collection).findOne({ _id: id });

    if (result) {
        if(dbType === 'wallet'){
            console.log(`Found a wallet in the collection for user with the id '${id}':`);
        }
        return result;
    } else {
        if(dbType === 'wallet'){
            console.log(`No wallet found for user with the id '${id}'`);
        }
        return false;
    }
}

async function removeEntry(dbType: string, collection: string, id: any): Promise<void> {
    const db = await connectDB(dbType);
    await db.collection(collection).deleteOne({ _id: id });
    // Optionally, log the removal for debugging or auditing purposes
    if(dbType === 'wallet'){
        console.log(`Entry for ${id} removed from the ${collection} collection.`);
    }
}
// Function to increment specific fields in a user's database entry
async function incrementFields(dbType: string, collection: string, id:string, fieldsToUpdate: Record<string, number>): Promise<void> {
    const db = await connectDB(dbType);
    await db.collection(collection).updateOne(
        { _id: id  as any }, 
        { $inc: fieldsToUpdate }
    );
}

process.on('SIGINT', async () => {
    if (client) {
        await client.close();
    }
    process.exit();
});

export { saveEntry, findEntryByID, removeEntry, incrementFields };
