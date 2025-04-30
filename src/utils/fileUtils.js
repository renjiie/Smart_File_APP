import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {FFprobeKit} from 'react-native-ffmpeg';
import {createThumbnail} from 'react-native-create-thumbnail';
import path from 'path-browserify';

/**
 * Get file extension from filename
 * @param {string} filename The filename
 * @returns {string} The file extension including dot
 */
export const getFileExtension = filename => {
  return path.extname(filename);
};

/**
 * Get MIME type based on file extension
 * @param {string} filename The filename
 * @returns {string|null} The MIME type or null if unknown
 */
export const getMimeType = filename => {
  const ext = getFileExtension(filename).toLowerCase();
  const mimeTypes = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.rtf': 'text/rtf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
  };
  
  return mimeTypes[ext] || null;
};

/**
 * Get information about a file
 * @param {string} filePath Path to the file
 * @returns {Promise<Object>} File information
 */
export const getFileInfo = async filePath => {
  try {
    // Get file stats
    const stats = await RNFS.stat(filePath);
    
    // Get file name
    const fileName = path.basename(filePath);
    const fileExt = getFileExtension(fileName).toLowerCase();
    
    // Base info
    const info = {
      name: fileName,
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime,
    };
    
    // Add type-specific info
    if (['.txt', '.md', '.rtf'].includes(fileExt)) {
      // For text files, add preview
      const content = await RNFS.readFile(filePath, 'utf8');
      info.preview = content.substring(0, 300) + (content.length > 300 ? '...' : '');
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExt)) {
      // For images, no additional info needed
    } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(fileExt)) {
      // For videos, get duration and thumbnail
      try {
        // Get duration using FFprobe
        const probe = await FFprobeKit.execute(`-v quiet -print_format json -show_format -show_streams "${filePath}"`);
        const probeData = JSON.parse(probe.getOutput());
        
        if (probeData && probeData.format && probeData.format.duration) {
          const durationSec = parseFloat(probeData.format.duration);
          info.duration = formatDuration(durationSec);
        }
        
        // Generate thumbnail
        const thumbnail = await createThumbnail({
          url: filePath,
          timeStamp: 1000, // 1 second into the video
          quality: 0.7,
        });
        
        info.thumbnail = thumbnail.path;
      } catch (mediaError) {
        console.error('Error getting media info:', mediaError);
      }
    }
    
    return info;
  } catch (error) {
    console.error('Error getting file info:', error);
    return {
      name: path.basename(filePath),
      path: filePath,
      error: 'Could not read file information',
    };
  }
};

/**
 * Format duration in seconds to a human-readable string
 * @param {number} seconds Duration in seconds
 * @returns {string} Formatted duration
 */
const formatDuration = seconds => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate a unique filename in the temporary directory
 * @param {string} prefix Prefix for the filename
 * @param {string} extension File extension (with dot)
 * @returns {string} Full path to the unique filename
 */
export const getUniqueFilename = (prefix, extension) => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  const tempDir = Platform.OS === 'ios' 
    ? RNFS.TemporaryDirectoryPath 
    : RNFS.CachesDirectoryPath;
  
  return `${tempDir}/${prefix}_${timestamp}_${random}${extension}`;
};
