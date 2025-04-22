import 'dotenv/config';
import {defineConfig} from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './src/db/Schema',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
    casing: "snake_case",
    verbose: true,
    entities: {
      roles: true
    }
  });