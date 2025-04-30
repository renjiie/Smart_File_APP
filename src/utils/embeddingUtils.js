import {Image, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

/**
 * Split text into chunks for processing
 * @param {string} text The input text
 * @param {number} maxChunkLength Maximum chunk length (default: 2048)
 * @returns {Array<string>} Array of text chunks
 */
export const splitTextIntoChunks = (text, maxChunkLength = 2048) => {
  if (!text || text.length === 0) {
    return [];
  }
  
  // If text is shorter than max length, return as is
  if (text.length <= maxChunkLength) {
    return [text];
  }
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkLength;
    
    // If we're not at the end of the text, try to find a suitable break point
    if (endIndex < text.length) {
      // Look for a paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > startIndex && paragraphBreak > startIndex + maxChunkLength / 2) {
        endIndex = paragraphBreak + 2; // Include the double newline
      } else {
        // Look for a newline
        const newlineBreak = text.lastIndexOf('\n', endIndex);
        if (newlineBreak > startIndex && newlineBreak > startIndex + maxChunkLength / 2) {
          endIndex = newlineBreak + 1; // Include the newline
        } else {
          // Look for a sentence end
          const sentenceBreak = Math.max(
            text.lastIndexOf('. ', endIndex),
            text.lastIndexOf('! ', endIndex),
            text.lastIndexOf('? ', endIndex),
          );
          if (sentenceBreak > startIndex && sentenceBreak > startIndex + maxChunkLength / 2) {
            endIndex = sentenceBreak + 2; // Include the punctuation and space
          } else {
            // Look for a space
            const spaceBreak = text.lastIndexOf(' ', endIndex);
            if (spaceBreak > startIndex && spaceBreak > startIndex + maxChunkLength / 2) {
              endIndex = spaceBreak + 1; // Include the space
            }
            // If none of these are found, we'll just cut at maxChunkLength
          }
        }
      }
    }
    
    chunks.push(text.substring(startIndex, endIndex));
    startIndex = endIndex;
  }
  
  return chunks;
};

/**
 * Average multiple embeddings into a single embedding
 * @param {Array<Array<number>>} embeddings Array of embedding arrays
 * @returns {Array<number>} Averaged embedding
 */
export const averageEmbeddings = embeddings => {
  if (!embeddings || embeddings.length === 0) {
    throw new Error('No embeddings to average');
  }
  
  // If there's only one embedding, return it
  if (embeddings.length === 1) {
    return embeddings[0];
  }
  
  // Get the dimension of the embeddings
  const dimension = embeddings[0].length;
  
  // Create a new array to store the sums
  const result = new Array(dimension).fill(0);
  
  // Sum all embeddings
  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      result[i] += embedding[i];
    }
  }
  
  // Divide by the number of embeddings to get the average
  for (let i = 0; i < dimension; i++) {
    result[i] /= embeddings.length;
  }
  
  return result;
};

/**
 * Preprocess an image for the vision model
 * @param {string} imagePath Path to the image file
 * @returns {Promise<Object>} Preprocessed image data
 */
export const preprocessImage = async imagePath => {
  try {
    // Resize image to 224x224 (standard size for many vision models)
    const resizedImage = await ImageResizer.createResizedImage(
      imagePath,
      224,
      224,
      'JPEG',
      90,
      0,
      undefined,
      false,
      {mode: 'contain', onlyScaleDown: false},
    );
    
    // Read the resized image as base64
    const base64Image = await RNFS.readFile(resizedImage.path, 'base64');
    
    // Decode the base64 image to a binary buffer
    const binaryData = Buffer.from(base64Image, 'base64');
    
    // Parse the JPEG image manually
    // Note: This is a simplified approach - in production you might want to use
    // a proper JPEG decoder library for React Native
    
    // In this simplified approach, we'll create a normalized RGB tensor
    // with placeholder values (0.5) for each pixel
    // In a production app, you would parse the actual JPEG data
    
    // Create a Float32Array with 3 channels, 224x224 dimensions
    const pixelData = new Float32Array(3 * 224 * 224);
    
    // Fill with normalized values (in this case 0.5 for demonstration)
    // In production, you would extract actual RGB values from the image
    for (let c = 0; c < 3; c++) {
      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          // For a proper implementation, extract actual pixel values here
          // For now, we use a simple normalization value
          pixelData[c * 224 * 224 + y * 224 + x] = 0.5;
        }
      }
    }
    
    // Clean up the resized image
    await RNFS.unlink(resizedImage.path);
    
    return {data: pixelData};
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw new Error('Failed to preprocess image: ' + error.message);
  }
};
