import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/server_config.prisma",

  migrations: {
    path: "prisma/migrations/server_config",
  },

  datasource: {
    url: env("SERVER_CONFIG_DATABASE_URL"),
  },
});