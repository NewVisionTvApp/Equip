/**
 * Unique Participant ID Generator
 * Generates memorable, high-contrast, human-readable IDs formatted as `EQ-XXXXX`.
 * Uses unambiguous characters (excluding 0, O, 1, I, L) for error-free verbal & manual transcription.
 */

const SAFE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 30 characters
const ID_PREFIX = "EQ";
const CODE_LENGTH = 5;

/**
 * Generates a single participant unique ID.
 * Example outputs: 'EQ-8K4NP', 'EQ-7M2DX', 'EQ-9H6RT'
 * Total address space: 30^5 = 24,300,000 unique combinations.
 */
export function generateParticipantId(): string {
  let code = "";
  const randomBytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < CODE_LENGTH; i++) {
    const index = randomBytes[i] % SAFE_ALPHABET.length;
    code += SAFE_ALPHABET[index];
  }

  return `${ID_PREFIX}-${code}`;
}

/**
 * Validates whether a given string adheres to the Participant ID format.
 */
export function isValidParticipantId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  const regex = /^EQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/;
  return regex.test(id.trim().toUpperCase());
}

/**
 * Normalizes input participant ID (trims and converts to uppercase).
 */
export function normalizeParticipantId(id: string): string {
  return id.trim().toUpperCase();
}
