import crypto from 'crypto';

const DEFAULT_ADMIN_USER = 'salendaradmin';
const DEFAULT_ADMIN_PASS = 'salendaradmin0630!!';

export const getAdminUser = () => process.env.ADMIN_USER || DEFAULT_ADMIN_USER;
export const getAdminPass = () => process.env.ADMIN_PASS || DEFAULT_ADMIN_PASS;

export const getAdminSessionToken = () => {
  const user = getAdminUser();
  const pass = getAdminPass();
  return crypto.createHash('sha256').update(`${user}:${pass}`).digest('hex');
};

export const safeEqual = (a: string, b: string) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};
