/**
 * Compatibility shim – replaces the old Manus OAuth login URL.
 * Now redirects to the Supabase Auth login page.
 */
export const getLoginUrl = () => '/login';

export const APP_NAME = 'SabaiSquad';
export const APP_VERSION = '2.0.0';
