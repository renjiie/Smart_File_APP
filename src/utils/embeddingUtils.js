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
    
    // Convert base64 to raw pixel data
    const imageData = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, 224, 224);
        
        // Get pixel data
        const imageData = ctx.getImageData(0, 0, 224, 224);
        
        // Convert to floating point data for the model:
        // - Normalize to [0,1]
        // - Rearrange from RGBA to RGB format
        // - Reshape from [H,W,C] to [C,H,W]
        const pixelData = new Float32Array(3 * 224 * 224);
        for (let y = 0; y < 224; y++) {
          for (let x = 0; x < 224; x++) {
            const pixelIndex = (y * 224 + x) * 4;
            
            // Normalize and rearrange
            pixelData[0 * 224 * 224 + y * 224 + x] = imageData.data[pixelIndex] / 255.0;     // R
            pixelData[1 * 224 * 224 + y * 224 + x] = imageData.data[pixelIndex + 1] / 255.0; // G
            pixelData[2 * 224 * 224 + y * 224 + x] = imageData.data[pixelIndex + 2] / 255.0; // B
          }
        }
        
        resolve({data: pixelData});
      };
      
      img.onerror = reject;
      img.src = `data:image/jpeg;base64,${base64Image}`;
    });
    
    // Clean up the resized image
    await RNFS.unlink(resizedImage.path);
    
    return imageData;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw new Error('Failed to preprocess image: ' + error.message);
  }
};
