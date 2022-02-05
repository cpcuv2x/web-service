export const config = {
  app: {
    port: process.env.APP_PORT ?? 5000,
  },
  db: {
    url: process.env.DB_URL,
  },
};
