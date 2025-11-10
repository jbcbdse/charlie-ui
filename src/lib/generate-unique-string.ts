export function generateUniqueString(): string {
  // Use the crypto API to generate a secure, unguessable string
  return window.crypto.getRandomValues(new Uint32Array(4)).join('-');
}
