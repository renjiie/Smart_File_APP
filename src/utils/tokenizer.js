/**
 * Enhanced tokenizer for the Nomic Embed Text model
 * 
 * This is an improved implementation that simulates subword tokenization
 * similar to what the Nomic Embed Text model would use.
 * 
 * In a production app, you would use the proper tokenizer specific to
 * the Nomic Embed Text model, which might require transformers.js
 * or a custom implementation based on the original tokenizer.
 */

// Maximum sequence length for the model
const MAX_SEQ_LENGTH = 2048;

// Common prefixes and suffixes to simulate subword tokenization
const COMMON_PREFIXES = ['un', 're', 'in', 'dis', 'en', 'non', 'im', 'il', 'ir', 'pre', 'pro', 'anti'];
const COMMON_SUFFIXES = ['ing', 'ed', 'ly', 'tion', 'ment', 'ness', 'ity', 'es', 's', 'able', 'ible', 'al', 'ial'];

/**
 * Tokenize text for the Nomic Embed Text model
 * @param {string} text The input text
 * @returns {Array<bigint>} Array of token IDs as BigInt
 */
export const tokenize = text => {
  if (!text || text.trim().length === 0) {
    // Return padding tokens for empty text
    return [BigInt(0)];
  }

  // Normalize text
  const normalizedText = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into sentences for better context handling
  const sentences = normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Process each sentence
  const allTokens = [];
  for (const sentence of sentences) {
    // Split into words and punctuation
    const words = sentence
      .replace(/([^\w\s])/g, ' $1 ')  // Add spaces around punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    // Process each word into subword tokens
    for (const word of words) {
      const subwords = breakIntoSubwords(word);
      for (const subword of subwords) {
        // Convert to a deterministic token ID
        const tokenId = getTokenId(subword);
        allTokens.push(tokenId);
      }
    }
  }
  
  // Add an EOS token
  allTokens.push(BigInt(1));
  
  // Truncate to max sequence length
  return allTokens.slice(0, MAX_SEQ_LENGTH);
};

/**
 * Break a word into subword tokens to simulate BPE tokenization
 * @param {string} word The word to break into subwords
 * @returns {Array<string>} Array of subword tokens
 */
const breakIntoSubwords = word => {
  // If it's a short word, keep it as is
  if (word.length <= 3) {
    return [word];
  }
  
  // If it's a punctuation, keep it as is
  if (/^[^\w]$/.test(word)) {
    return [word];
  }
  
  const subwords = [];
  let remaining = word;
  
  // Check for prefixes
  for (const prefix of COMMON_PREFIXES) {
    if (remaining.startsWith(prefix) && remaining.length > prefix.length + 1) {
      subwords.push(prefix);
      remaining = remaining.slice(prefix.length);
      break;
    }
  }
  
  // Check for suffixes
  for (const suffix of COMMON_SUFFIXES) {
    if (remaining.endsWith(suffix) && remaining.length > suffix.length + 1) {
      const stem = remaining.slice(0, -suffix.length);
      subwords.push(stem);
      subwords.push(suffix);
      remaining = '';
      break;
    }
  }
  
  // If no prefix/suffix was found, use character-based splitting for longer words
  if (remaining.length > 0) {
    if (remaining.length > 6) {
      // Split into chunks of 3-4 characters
      let i = 0;
      while (i < remaining.length) {
        const chunkSize = Math.min(3 + (i % 2), remaining.length - i);
        subwords.push(remaining.slice(i, i + chunkSize));
        i += chunkSize;
      }
    } else {
      subwords.push(remaining);
    }
  }
  
  return subwords;
};

/**
 * Convert a subword token to a deterministic token ID
 * @param {string} token The subword token
 * @returns {bigint} The token ID as BigInt
 */
const getTokenId = token => {
  // Create a stable hash for the token
  const hash = token
    .split('')
    .reduce((acc, char, i) => acc + char.charCodeAt(0) * (127 ** (i % 4)), 0) % 49152;
  
  // Avoid 0, 1, 2 which are often special tokens (PAD, EOS, BOS)
  return BigInt(hash + 3);
};

/**
 * Decode token IDs back to text
 * This is not needed for embedding generation but included for completeness
 * @param {Array<bigint>} tokenIds Array of token IDs
 * @returns {string} Decoded text
 */
export const decodeTokens = tokenIds => {
  // This is a placeholder - in a real implementation you would use
  // the model's vocabulary mapping in reverse
  return '[Decoded text would appear here]';
};
