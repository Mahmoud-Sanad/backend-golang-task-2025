import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/standard_db.prisma",

  migrations: {
    path: "prisma/migrations/standard_db",
  },

  datasource: {
    url: env("STANDARD_DATABASE_URL"),
  },
});