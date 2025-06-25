import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}; 