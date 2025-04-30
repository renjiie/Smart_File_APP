import {getTextEmbedding} from './modelService';
import {searchByVector} from './databaseService';

/**
 * Search files using a text query
 * @param {string} query The search query
 * @param {number} limit Maximum number of results to return
 * @returns {Promise<Array>} Array of search results
 */
export const searchFiles = async (query, limit = 20) => {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await getTextEmbedding(query);
    
    // Search using the embedding
    const results = await searchByVector(queryEmbedding, limit);
    
    return results;
  } catch (error) {
    console.error('Error searching files:', error);
    throw new Error('Failed to search files: ' + error.message);
  }
};
