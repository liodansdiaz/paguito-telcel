export const NOTIFICATIONS_CONFIG = {
  email: process.env.NOTIFICATIONS_EMAIL === 'true',
  whatsapp: process.env.NOTIFICATIONS_WHATSAPP === 'true',
  internal: process.env.NOTIFICATIONS_INTERNAL !== 'false',
};
