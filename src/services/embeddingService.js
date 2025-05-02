import RNFS from "react-native-fs";
import { Platform } from "react-native";
import { FFmpegKit, FFprobeKit } from "ffmpeg-kit-react-native";
import { createThumbnail } from "react-native-create-thumbnail";
import { getTextEmbedding, getVisionEmbedding } from "./modelService";
import {
  splitTextIntoChunks,
  averageEmbeddings,
  preprocessImage,
} from "../utils/embeddingUtils";
import { getUniqueFilename } from "../utils/fileUtils";

/**
 * Process a text file and generate embeddings
 * @param {string} filePath Path to the text file
 * @returns {Promise<Object>} Object containing the embedding
 */
export const processTextFile = async (filePath) => {
  try {
    // Read the file
    const content = await RNFS.readFile(filePath, "utf8");

    // Split text into chunks for processing
    const chunks = splitTextIntoChunks(content);

    // Generate embeddings for each chunk
    const embeddings = [];
    for (const chunk of chunks) {
      if (chunk.trim().length > 0) {
        const embedding = await getTextEmbedding(chunk);
        embeddings.push(embedding);
      }
    }

    // Average the embeddings if there's more than one chunk
    const finalEmbedding =
      embeddings.length > 1 ? averageEmbeddings(embeddings) : embeddings[0];

    return {
      embedding: finalEmbedding,
    };
  } catch (error) {
    console.error("Error processing text file:", error);
    throw new Error(
      `Failed to process text file: ${error.message || "Unknown error"}`
    );
  }
};

/**
 * Process an image file and generate embeddings
 * @param {string} filePath Path to the image file
 * @returns {Promise<Object>} Object containing the embedding
 */
export const processImageFile = async (filePath) => {
  try {
    // Preprocess the image for the vision model
    const processedImageData = await preprocessImage(filePath);

    // Generate embedding
    const embedding = await getVisionEmbedding(processedImageData);

    return {
      embedding,
    };
  } catch (error) {
    console.error("Error processing image file:", error);
    throw new Error(
      `Failed to process image file: ${error.message || "Unknown error"}`
    );
  }
};

/**
 * Process a video file by extracting frames and generate embeddings
 * @param {string} filePath Path to the video file
 * @returns {Promise<Object>} Object containing the embedding
 */
export const processVideoFile = async (filePath) => {
  const tempDir = `${
    Platform.OS === "ios"
      ? RNFS.TemporaryDirectoryPath
      : RNFS.CachesDirectoryPath
  }/frames`;

  try {
    // Create temp directory for frames if it doesn't exist
    const dirExists = await RNFS.exists(tempDir);
    if (!dirExists) {
      await RNFS.mkdir(tempDir);
    } else {
      // Clean up existing frames
      const files = await RNFS.readDir(tempDir);
      for (const file of files) {
        await RNFS.unlink(file.path);
      }
    }

    // Extract frames using FFmpeg (1 frame per second)
    const outputPattern = `${tempDir}/frame-%04d.jpg`;
    await FFmpegKit.execute(
      `-i "${filePath}" -vf fps=1 -q:v 2 "${outputPattern}"`
    );

    // Get the extracted frames
    const files = await RNFS.readDir(tempDir);
    const frameFiles = files.filter((file) => file.name.startsWith("frame-"));

    // Generate embeddings for each frame
    const embeddings = [];
    for (const frameFile of frameFiles.slice(0, 10)) {
      // Limit to 10 frames for performance
      const processedFrameData = await preprocessImage(frameFile.path);
      const embedding = await getVisionEmbedding(processedFrameData);
      embeddings.push(embedding);
    }

    // Clean up
    await RNFS.unlink(tempDir);

    // Average the embeddings
    const finalEmbedding = averageEmbeddings(embeddings);

    return {
      embedding: finalEmbedding,
    };
  } catch (error) {
    console.error("Error processing video file:", error);
    // Clean up on error
    try {
      await RNFS.unlink(tempDir);
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
    throw new Error(
      `Failed to process video file: ${error.message || "Unknown error"}`
    );
  }
};
