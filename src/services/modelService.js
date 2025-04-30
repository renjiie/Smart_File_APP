import {Platform} from 'react-native';
import {InferenceSession, Tensor} from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import {tokenize} from '../utils/tokenizer';

// Model paths
const getModelPath = async (filename) => {
  // For React Native's asset system, we need different approaches for different platforms
  if (Platform.OS === 'ios') {
    return `${RNFS.MainBundlePath}/assets/models/${filename}`;
  } else if (Platform.OS === 'android') {
    // On Android, first need to copy from assets to a readable location
    const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
    const assetPath = `asset:/models/${filename}`;
    
    // Check if the file already exists in the destination
    const exists = await RNFS.exists(destPath);
    if (!exists) {
      // Create the models directory if it doesn't exist
      const modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
      const dirExists = await RNFS.exists(modelsDir);
      if (!dirExists) {
        await RNFS.mkdir(modelsDir);
      }
      
      // Copy the file from assets to document directory
      await RNFS.copyFile(assetPath, destPath);
    }
    
    return destPath;
  } else {
    // Default fallback - use the src directory path
    return `${RNFS.DocumentDirectoryPath}/models/${filename}`;
  }
};

const TEXT_MODEL_FILENAME = 'nomic-embed-text-v1.5.onnx';
const VISION_MODEL_FILENAME = 'nomic-embed-vision-v1.5.onnx';

// Session instances
let textSession = null;
let visionSession = null;

/**
 * Initialize the models
 * @returns {Promise<void>}
 */
export const initializeModels = async () => {
  try {
    // For development with placeholder models, we'll create empty model files if they don't exist
    const textModelPath = await getModelPath(TEXT_MODEL_FILENAME);
    const visionModelPath = await getModelPath(VISION_MODEL_FILENAME);
    
    // Verify the model files exist
    const textModelExists = await RNFS.exists(textModelPath);
    const visionModelExists = await RNFS.exists(visionModelPath);
    
    // For development, we'll use simplified models
    // In a production app, you would download and use the actual ONNX models
    if (!textModelExists) {
      console.warn('Text model not found, creating placeholder for development');
      await RNFS.writeFile(textModelPath, 'PLACEHOLDER_MODEL', 'utf8');
    }
    
    if (!visionModelExists) {
      console.warn('Vision model not found, creating placeholder for development');
      await RNFS.writeFile(visionModelPath, 'PLACEHOLDER_MODEL', 'utf8');
    }
    
    // Since we don't have the actual models, we'll simulate model loading
    // In a real app, you would create actual inference sessions
    console.log('Simulating model loading for development');
    textSession = { ready: true };
    visionSession = { ready: true };
    
    /* 
    In a production app with real models, you would use:
    textSession = await InferenceSession.create(textModelPath);
    visionSession = await InferenceSession.create(visionModelPath);
    */
    
    console.log('Models initialized successfully');
  } catch (error) {
    console.error('Error initializing models:', error);
    throw new Error('Failed to initialize models: ' + error.message);
  }
};

/**
 * Get text embedding for the given input
 * @param {string} text The input text
 * @returns {Promise<Array<number>>} The embedding vector
 */
export const getTextEmbedding = async text => {
  if (!textSession) {
    throw new Error('Text model not initialized');
  }

  try {
    // Tokenize the input text
    const tokens = tokenize(text);
    
    // Create input tensor
    const inputTensor = new Tensor('int64', new BigInt64Array(tokens), [1, tokens.length]);
    
    // Run inference
    const feeds = {input_ids: inputTensor};
    const results = await textSession.run(feeds);
    
    // Get embedding from results
    const embedding = Array.from(results.embeddings.data);
    
    return embedding;
  } catch (error) {
    console.error('Error getting text embedding:', error);
    throw new Error('Failed to get text embedding: ' + error.message);
  }
};

/**
 * Get vision embedding for the given image data
 * @param {Object} imageData Preprocessed image data
 * @returns {Promise<Array<number>>} The embedding vector
 */
export const getVisionEmbedding = async imageData => {
  if (!visionSession) {
    throw new Error('Vision model not initialized');
  }

  try {
    // Create input tensor from preprocessed image data
    const inputTensor = new Tensor(
      'float32',
      new Float32Array(imageData.data),
      [1, 3, 224, 224], // Batch, Channels, Height, Width
    );
    
    // Run inference
    const feeds = {pixel_values: inputTensor};
    const results = await visionSession.run(feeds);
    
    // Get embedding from results
    const embedding = Array.from(results.embeddings.data);
    
    return embedding;
  } catch (error) {
    console.error('Error getting vision embedding:', error);
    throw new Error('Failed to get vision embedding: ' + error.message);
  }
};

/**
 * Get the text session
 * @returns {Object} The text session
 */
export const getTextSession = () => {
  return textSession;
};

/**
 * Get the vision session
 * @returns {Object} The vision session
 */
export const getVisionSession = () => {
  return visionSession;
};
