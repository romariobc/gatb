const { CosmosClient } = require("@azure/cosmos");

const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
// Warning: In production, ensure the connection string is set in App Settings.

let client = null;
let container = null;

async function getContainer() {
    if (container) return container;

    if (!connectionString) {
        throw new Error("COSMOS_DB_CONNECTION_STRING is not defined");
    }

    if (!client) {
        client = new CosmosClient(connectionString);
    }

    const { database } = await client.databases.createIfNotExists({ id: "gatb-db" });
    const result = await database.containers.createIfNotExists({ id: "patients", partitionKey: "/id" });
    container = result.container;

    return container;
}

module.exports = { getContainer };
