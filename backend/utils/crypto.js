const crypto = require('crypto');

/**
 * Generate a random token for email verification, password reset, etc.
 * @param {number} length - Length of the token (default: 32)
 * @returns {string} Random hexadecimal token
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Create a hash from a token using crypto
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Encrypt sensitive data (like API keys)
 * @param {string} text - Text to encrypt
 * @param {string} secretKey - Secret key for encryption
 * @returns {string} Encrypted text
 */
const encrypt = (text, secretKey = process.env.JWT_SECRET) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('telegraph'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
};

/**
 * Decrypt encrypted data
 * @param {string} encryptedText - Text to decrypt
 * @param {string} secretKey - Secret key for decryption
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedText, secretKey = process.env.JWT_SECRET) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  
  const [ivHex, encrypted, authTagHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('telegraph'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

module.exports = {
  generateRandomToken,
  hashToken,
  encrypt,
  decrypt
};