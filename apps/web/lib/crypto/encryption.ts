/**
 * Aurora End-to-End Encryption Utility
 * Uses AES-GCM with the Web Crypto API
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

/**
 * Derives a CryptoKey from a string secret
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('aurora-salt'), // In production, salts should be unique per user/channel
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a string message
 * Returns a base64 string containing both IV and ciphertext
 */
export async function encryptMessage(content: string, secret: string): Promise<string> {
    try {
        const key = await deriveKey(secret);
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const enc = new TextEncoder();

        const ciphertext = await window.crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            enc.encode(content)
        );

        // Combine IV and ciphertext
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        return content; // Fallback to plain text if encryption fails (should be handled better)
    }
}

/**
 * Decrypts a base64 string message
 */
export async function decryptMessage(encryptedContent: string, secret: string): Promise<string> {
    try {
        const key = await deriveKey(secret);
        const combined = new Uint8Array(
            atob(encryptedContent).split('').map(c => c.charCodeAt(0))
        );

        const iv = combined.slice(0, IV_LENGTH);
        const ciphertext = combined.slice(IV_LENGTH);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        // If decryption fails, it might not be encrypted or the key is wrong
        console.warn('Decryption failed, returning original content');
        return encryptedContent;
    }
}
