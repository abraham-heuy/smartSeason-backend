export function generateRandomPassword(): string {
    const prefix = 'Shamba';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const specialChar = '#';
    return `${prefix}${randomNum}${specialChar}`;
  }