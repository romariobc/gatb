const { app } = require('@azure/functions');
const { getContainer } = require('../db');

app.http('patients', {
    methods: ['GET', 'POST'],
    route: 'patients',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const container = await getContainer();

        if (request.method === 'GET') {
            try {
                // Fetch all items
                const { resources } = await container.items.query("SELECT * FROM c").fetchAll();

                // Separate into patients (active) and history based on status
                // If status is undefined, assume 'active' for legacy or default
                const patients = resources.filter(r => !r.status || r.status === 'active');
                const history = resources.filter(r => r.status === 'history');

                return { jsonBody: { patients, history } };
            } catch (error) {
                context.error(error);
                return { status: 500, body: "Error fetching data" };
            }
        }

        if (request.method === 'POST') {
            try {
                const item = await request.json();

                // Ensure ID and Status
                if (!item.id) item.id = Date.now().toString();
                else item.id = item.id.toString();

                item.status = item.status || 'active';

                const { resource } = await container.items.create(item);
                return { status: 201, jsonBody: resource };
            } catch (error) {
                context.error(error);
                return { status: 500, body: "Error creating item" };
            }
        }
    }
});

app.http('patientById', {
    methods: ['PUT', 'DELETE'],
    route: 'patients/{id}',
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const container = await getContainer();
        const id = request.params.id;

        if (request.method === 'PUT') {
            try {
                const updates = await request.json();

                // Read existing item
                // Use partition key = id
                const { resource: existing } = await container.item(id, id).read();

                if (!existing) {
                    return { status: 404, body: "Item not found" };
                }

                // Merge updates
                const updatedItem = { ...existing, ...updates, id: id };

                // Replace item
                const { resource } = await container.item(id, id).replace(updatedItem);
                return { jsonBody: resource };
            } catch (error) {
                context.error(error);
                return { status: 500, body: "Error updating item" };
            }
        }

        if (request.method === 'DELETE') {
            try {
                // Delete item
                await container.item(id, id).delete();
                return { status: 204 };
            } catch (error) {
                context.error(error);
                return { status: 500, body: "Error deleting item" };
            }
        }
    }
});
