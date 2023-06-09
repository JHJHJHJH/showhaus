export default () => ({
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT) || 5432,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_DB: process.env.POSTGRES_DB,
  URA_API_KEY: process.env.URA_API_KEY,
  SUPERTOKENS_URI:
    process.env.NODE_ENV === 'production'
      ? process.env.SUPERTOKENS_URI_PROD
      : process.env.SUPERTOKENS_URI_DEV,
  SUPERTOKENS_API_KEY:
    process.env.NODE_ENV === 'production'
      ? process.env.SUPERTOKENS_API_KEY_PROD
      : process.env.SUPERTOKENS_API_KEY_DEV,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});
