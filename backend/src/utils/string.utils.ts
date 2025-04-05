import { customAlphabet } from 'nanoid';


export const generateShortCode = ({ length = 5, prefix = '' }: { length?: number; prefix?: string }): string => {
  return `${prefix}${customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', length)()}`;
};
