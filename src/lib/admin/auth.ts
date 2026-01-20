const DEFAULT_ADMIN_USER = 'salendaradmin';
const DEFAULT_ADMIN_PASS = 'salendaradmin0630!!';
const DEFAULT_ADMIN_SESSION = 'salendaradmin-session';

export const getAdminUser = () => process.env.ADMIN_USER || DEFAULT_ADMIN_USER;
export const getAdminPass = () => process.env.ADMIN_PASS || DEFAULT_ADMIN_PASS;

export const getAdminSessionToken = () => {
  return process.env.ADMIN_SESSION_TOKEN || DEFAULT_ADMIN_SESSION;
};

export const safeEqual = (a: string, b: string) => {
  return a === b;
};
