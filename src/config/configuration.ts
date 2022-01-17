export default () => {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not specified');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not specified');
  }
  if (!process.env.APP_PORT) {
    throw new Error('APP_PORT is not specified');
  }

  return {
    app: {
      port: process.env.APP_PORT,
    },
    database: {
      uri: process.env.DATABASE_URI,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRATION_TIME || '1h',
    },
  };
};
