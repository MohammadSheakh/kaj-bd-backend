/**
 * AES-256-GCM Decryption Example
 * Run: node decrypt.js
 */

// import crypto from "crypto";
const crypto = require("crypto");

// --- Inputs ---
const keyHex =
  "e783f2d8d8d9491ba262bd7a5f8b28c4c4b21c915cb9d1c5e8c8e630d99b57d2"; // 32-byte hex key
const ivHex = "df9afe5ae49f1c2cb3c31df3"; // 12-byte hex IV
const cipherHex =
  "a9484d88d53a4a1f33063cd0b9e0c0a6c6670fedaae08a6b94edc04afc6e740de445d18b3567947fe7092d1e03b5416094f2de90e7e4c14e882669dc2cfaf9fca4e4717cca5099b72194cfe9"; // ciphertext + 16-byte auth tag

// --- Decrypt function ---
function decryptAES256GCM(keyHex, ivHex, cipherHexWithTag) {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const data = Buffer.from(cipherHexWithTag, "hex");

  // Last 16 bytes = authentication tag
  const authTag = data.slice(data.length - 16);
  const ciphertext = data.slice(0, data.length - 16);

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, {
      authTagLength: 16,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("❌ Decryption failed:", err.message);
    return null;
  }
}

// --- Run decryption ---
const result = decryptAES256GCM(keyHex, ivHex, cipherHex);

console.log("✅ Decrypted text:");
console.log(result ?? "No output — check key, IV, or ciphertext!");


///==================================================


// const keyHex = 'e783f2d8d8d9491ba262bd7a5f8b28c4c4b21c915cb9d1c5e8c8e630d99b57d2'; // same key used for decrypt
const key = Buffer.from(keyHex, 'hex');

function encryptAES256GCM(plainText) {
  const iv = crypto.randomBytes(12); // 12-byte IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine ciphertext + tag (for decrypting later)
  const encryptedHex = Buffer.concat([encrypted, authTag]).toString('hex');

  return {
    data: encryptedHex,
    iv: iv.toString('hex'),
  };
}

// Example usage
const text = "While booking a service .. user should write .. what he want";
// const result1 = encryptAES256GCM(text);

// console.log('Encrypted output:');
// console.log(JSON.stringify(result1, null, 2));

// Encrypted output:
// {
//   "data": "a9484d88d53a4a1f33063cd0b9e0c0a6c6670fedaae08a6b94edc04afc6e740de445d18b3567947fe7092d1e03b5416094f2de90e7e4c14e882669dc2cfaf9fca4e4717cca5099b72194cfe9",
//   "iv": "df9afe5ae49f1c2cb3c31df3"
// }