export default () => {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not specified');
  }

  return {
    database: {
      uri: process.env.DATABASE_URI,
    },
  };
};
