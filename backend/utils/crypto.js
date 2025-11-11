const crypto = require('crypto');

/**
 * Generate a random token for email verification, password reset, etc.
 * @param {number} length - Number of bytes to generate (default: 32)
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
 * Generate AES encryption key from JWT secret
 * @returns {Buffer} AES key
 */
const getEncryptionKey = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set for encryption');
  }
  return crypto.scryptSync(process.env.JWT_SECRET, 'telegraph-salt', 32);
};

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text in format: iv:encrypted:authTag
 */
const encryptAES = (text) => {
  try {
    const algorithm = 'aes-256-gcm';
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // recommended 12 bytes for GCM

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // optional associated data for integrity
    cipher.setAAD(Buffer.from('telegraph'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt AES-256-GCM encrypted text
 * @param {string} encryptedText - Encrypted text in format: iv:encrypted:authTag
 * @returns {string} Decrypted text
 */
const decryptAES = (encryptedText) => {
  try {
    const algorithm = 'aes-256-gcm';
    const key = getEncryptionKey();

    const [ivHex, encrypted, authTagHex] = encryptedText.split(':');

    if (!ivHex || !encrypted || !authTagHex) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAAD(Buffer.from('telegraph'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt sensitive fields in an object
 * @param {Object} data - Object containing sensitive data
 * @param {Array} fields - Fields to encrypt
 * @returns {Object} Object with encrypted fields
 */
const encryptSensitiveFields = (data, fields = ['email']) => {
  const encryptedData = { ...data };

  fields.forEach(field => {
    if (encryptedData[field]) {
      encryptedData[field] = encryptAES(String(encryptedData[field]));
    }
  });

  return encryptedData;
};

/**
 * Decrypt sensitive fields in an object
 * @param {Object} data - Object containing encrypted data
 * @param {Array} fields - Fields to decrypt
 * @returns {Object} Object with decrypted fields
 */
const decryptSensitiveFields = (data, fields = ['email']) => {
  const decryptedData = { ...data };

  fields.forEach(field => {
    if (decryptedData[field] && typeof decryptedData[field] === 'string') {
      try {
        decryptedData[field] = decryptAES(decryptedData[field]);
      } catch (error) {
        console.warn(`Failed to decrypt field ${field}:`, error.message);
        // Keep the encrypted value if decryption fails
      }
    }
  });

  return decryptedData;
};

/**
 * Bulk decrypt array of objects
 * @param {Array} dataArray - Array of objects with encrypted fields
 * @param {Array} fields - Fields to decrypt
 * @returns {Array} Array of objects with decrypted fields
 */
const bulkDecryptSensitiveFields = (dataArray, fields = ['email']) => {
  return dataArray.map(item => decryptSensitiveFields(item.toObject ? item.toObject() : item, fields));
};

// Legacy wrappers kept for backwards compatibility
const encrypt = (text, secretKey = process.env.JWT_SECRET) => {
  console.warn('encrypt() is deprecated; use encryptAES() instead');
  // If a custom secretKey was provided, temporarily override JWT_SECRET
  if (secretKey && secretKey !== process.env.JWT_SECRET) {
    const key = crypto.scryptSync(secretKey, 'telegraph-salt', 32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from('telegraph'));
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  return encryptAES(String(text));
};

const decrypt = (encryptedText, secretKey = process.env.JWT_SECRET) => {
  console.warn('decrypt() is deprecated; use decryptAES() instead');
  if (secretKey && secretKey !== process.env.JWT_SECRET) {
    const key = crypto.scryptSync(secretKey, 'telegraph-salt', 32);
    const [ivHex, encrypted, authTagHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from('telegraph'));
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  return decryptAES(encryptedText);
};

module.exports = {
  generateRandomToken,
  hashToken,
  getEncryptionKey,
  encryptAES,
  decryptAES,
  encryptSensitiveFields,
  decryptSensitiveFields,
  bulkDecryptSensitiveFields,
  // legacy
  encrypt,
  decrypt
};