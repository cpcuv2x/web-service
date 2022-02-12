export const configCheck = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not specified");
  }
};

export const getConfig = () => ({
  app: {
    port: process.env.APP_PORT ?? 5000,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION_TIME || "1h",
  },
});
