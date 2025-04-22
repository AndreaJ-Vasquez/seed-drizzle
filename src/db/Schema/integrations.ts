import {
    pgSchema,
    integer,
    varchar,
    text,
    jsonb,
    uuid,
  } from "drizzle-orm/pg-core";
  import { essentials, orgInfo } from "../db-utils";
  
  export const integrationSchema = pgSchema("integrations");
  
  export const slack = integrationSchema.table("slack", {
    id: uuid("id").defaultRandom().primaryKey(),
    slackTeamId: text("slack_team_id").notNull(),
    slackChannelId: text("slack_channel_id").notNull(),
    webhookUrl: text("webhook_url").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    config: jsonb("config").notNull(),
    ...orgInfo,
    ...essentials,
  });
  