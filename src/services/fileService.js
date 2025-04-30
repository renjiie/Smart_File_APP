import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {getMimeType, getFileExtension} from '../utils/fileUtils';
import {
  processTextFile,
  processImageFile,
  processVideoFile,
} from './embeddingService';
import {storeEmbedding} from './databaseService';

/**
 * Main function to process a file based on its type
 * @param {Object} file File object from document picker
 * @returns {Promise<void>}
 */
export const processFile = async file => {
  try {
    // Get file path based on platform
    const filePath = Platform.select({
      ios: decodeURIComponent(file.uri.replace('file://', '')),
      android: file.uri,
      default: file.uri,
    });

    // Determine file type
    const fileType = determineFileType(file);
    if (!fileType) {
      throw new Error(`Unsupported file type: ${file.type || file.name}`);
    }

    // Process file based on type
    let processedData;
    switch (fileType) {
      case 'text':
        processedData = await processTextFile(filePath);
        break;
      case 'image':
        processedData = await processImageFile(filePath);
        break;
      case 'video':
        processedData = await processVideoFile(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Store embedding in database
    await storeEmbedding({
      id: generateId(filePath),
      path: filePath,
      type: fileType,
      embedding: processedData.embedding,
      dateAdded: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
};

/**
 * Determine file type based on mime type or extension
 * @param {Object} file File object from document picker
 * @returns {string|null} File type ('text', 'image', 'video') or null if unsupported
 */
const determineFileType = file => {
  // Try to get mime type
  const mimeType = file.type || getMimeType(file.name);
  if (mimeType) {
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
  }

  // Fallback to extension
  const extension = getFileExtension(file.name).toLowerCase();
  if (['.txt', '.md', '.rtf'].includes(extension)) return 'text';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension))
    return 'image';
  if (['.mp4', '.mov', '.avi', '.mkv'].includes(extension)) return 'video';

  return null;
};

/**
 * Generate a unique ID for the file
 * @param {string} filePath Full path to the file
 * @returns {string} Unique ID
 */
const generateId = filePath => {
  // Create a hash from the file path and current timestamp
  return (
    filePath.replace(/[^a-zA-Z0-9]/g, '') +
    '_' +
    new Date().getTime().toString()
  );
};
