import {Platform} from 'react-native';
import {InferenceSession, Tensor} from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import {tokenize} from '../utils/tokenizer';

// Model paths
const MODEL_DIR = Platform.OS === 'ios' 
  ? `${RNFS.MainBundlePath}/assets/models` 
  : 'assets/models';

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
    // Check if the model files exist
    const textModelExists = await RNFS.exists(`${MODEL_DIR}/${TEXT_MODEL_FILENAME}`);
    const visionModelExists = await RNFS.exists(`${MODEL_DIR}/${VISION_MODEL_FILENAME}`);

    if (!textModelExists || !visionModelExists) {
      throw new Error(
        'Model files not found. Please ensure the ONNX models are in the correct directory.',
      );
    }

    // Create inference sessions
    textSession = await InferenceSession.create(`${MODEL_DIR}/${TEXT_MODEL_FILENAME}`);
    visionSession = await InferenceSession.create(`${MODEL_DIR}/${VISION_MODEL_FILENAME}`);

    console.log('Models loaded successfully');
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
