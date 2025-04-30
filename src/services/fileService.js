import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {getMimeType, getFileExtension, getFileInfo} from '../utils/fileUtils';
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
 * Recursively scan a folder for files
 * @param {string} folderPath Path to the folder to scan
 * @param {Function} progressCallback Function to call with file count updates
 * @returns {Promise<Array<Object>>} Array of file objects
 */
export const scanFolderForFiles = async (folderPath, progressCallback = null) => {
  let fileCount = 0;
  const supportedFiles = [];
  
  // Function to recursively process folders
  const processFolder = async (path) => {
    try {
      const items = await RNFS.readDir(path);
      
      for (const item of items) {
        if (item.isDirectory()) {
          // Recursively scan subdirectories
          await processFolder(item.path);
        } else {
          // Check if this is a supported file type
          const extension = getFileExtension(item.name).toLowerCase();
          const mimeType = getMimeType(item.name);
          
          // Create a file object similar to what document picker would return
          const fileObj = {
            uri: Platform.OS === 'ios' 
              ? `file://${item.path}` 
              : item.path,
            type: mimeType,
            name: item.name,
            size: item.size,
          };
          
          if (determineFileType(fileObj)) {
            supportedFiles.push(fileObj);
            fileCount++;
            
            // Call progress callback if provided
            if (progressCallback && fileCount % 10 === 0) {
              progressCallback(fileCount);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${path}:`, error);
      // Continue with other directories instead of failing completely
    }
  };
  
  await processFolder(folderPath);
  
  // Final progress update
  if (progressCallback) {
    progressCallback(fileCount);
  }
  
  return supportedFiles;
};

/**
 * Process multiple files from a folder
 * @param {Array<Object>} files Array of file objects
 * @param {Function} progressCallback Function to call with progress updates
 * @returns {Promise<Array<Object>>} Array of processing results
 */
export const processFolderFiles = async (files, progressCallback = null) => {
  const results = [];
  let processedCount = 0;
  
  for (const file of files) {
    try {
      const success = await processFile(file);
      results.push({
        file,
        success,
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      results.push({
        file,
        error: error.message,
      });
    }
    
    processedCount++;
    if (progressCallback) {
      progressCallback(processedCount, files.length);
    }
  }
  
  return results;
};

/**
 * Determine file type based on mime type or extension
 * @param {Object} file File object from document picker or file scan
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
