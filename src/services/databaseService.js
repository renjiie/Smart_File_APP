import {createRxDatabase, addRxPlugin} from 'rxdb';
import {getRxStorageDexie} from 'rxdb/plugins/storage-dexie';
import {RxDBQueryBuilderPlugin} from 'rxdb/plugins/query-builder';
import {RxDBMigrationPlugin} from 'rxdb/plugins/migration-schema';
import {RxDBLocalDocumentsPlugin} from 'rxdb/plugins/local-documents';

// Add RxDB plugins
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBLocalDocumentsPlugin);

// Database instance
let database = null;
let itemsCollection = null;

/**
 * Initialize the database
 * @returns {Promise<void>}
 */
export const initializeDatabase = async () => {
  if (database) return; // Already initialized

  try {
    // Create database
    database = await createRxDatabase({
      name: 'multimodal_search_db',
      storage: getRxStorageDexie(),
    });

    // Define schema for items collection
    const itemsSchema = {
      title: 'items schema',
      version: 0,
      description: 'stores file embeddings for search',
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: {
          type: 'string',
          maxLength: 100,
        },
        path: {
          type: 'string',
        },
        type: {
          type: 'string',
          enum: ['text', 'image', 'video'],
        },
        embedding: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        dateAdded: {
          type: 'string',
        },
      },
      required: ['id', 'path', 'type', 'embedding'],
    };

    // Create collections
    itemsCollection = await database.addCollections({
      items: {
        schema: itemsSchema,
      },
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error('Failed to initialize database: ' + error.message);
  }
};

/**
 * Store an embedding in the database
 * @param {Object} data The data object to store
 * @returns {Promise<Object>} The stored document
 */
export const storeEmbedding = async data => {
  if (!database || !itemsCollection) {
    throw new Error('Database not initialized');
  }

  try {
    // Check if a document with this ID already exists
    const existing = await itemsCollection.findOne({
      selector: {
        id: data.id,
      },
    }).exec();

    if (existing) {
      // Update existing document
      return await existing.update({
        $set: {
          embedding: data.embedding,
          dateAdded: data.dateAdded,
        },
      });
    } else {
      // Insert new document
      return await itemsCollection.insert(data);
    }
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw new Error('Failed to store embedding: ' + error.message);
  }
};

/**
 * Perform a vector search using the given query embedding
 * @param {Array<number>} queryEmbedding The query embedding vector
 * @param {number} limit Maximum number of results to return
 * @param {number} threshold Maximum distance threshold
 * @returns {Promise<Array>} Array of matching documents
 */
export const searchByVector = async (
  queryEmbedding,
  limit = 20,
  threshold = 0.5,
) => {
  if (!database || !itemsCollection) {
    throw new Error('Database not initialized');
  }

  try {
    const results = await itemsCollection
      .find({
        selector: {
          embedding: {
            $vector: {
              $euclideanDistance: queryEmbedding,
              $maxDistance: threshold,
            },
          },
        },
        limit,
      })
      .exec();

    return results.map(doc => {
      const data = doc.toJSON();
      // Calculate score (1 - normalized distance) for better UX
      const distance = doc.get('_distance');
      data.score = distance !== undefined ? 1 - distance / threshold : 1;
      return data;
    });
  } catch (error) {
    console.error('Error searching vectors:', error);
    throw new Error('Failed to search: ' + error.message);
  }
};

/**
 * Get all stored items
 * @returns {Promise<Array>} Array of all documents
 */
export const getAllItems = async () => {
  if (!database || !itemsCollection) {
    throw new Error('Database not initialized');
  }

  try {
    const results = await itemsCollection.find().exec();
    return results.map(doc => doc.toJSON());
  } catch (error) {
    console.error('Error getting all items:', error);
    throw new Error('Failed to get items: ' + error.message);
  }
};

/**
 * Get the database instance
 * @returns {Object} The RxDB database instance
 */
export const getDatabase = () => {
  return database;
};

/**
 * Clean up the database connection
 * @returns {Promise<void>}
 */
export const cleanupDatabase = async () => {
  if (database) {
    await database.destroy();
    database = null;
    itemsCollection = null;
  }
};
