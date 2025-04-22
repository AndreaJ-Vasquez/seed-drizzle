import { timestamp, text } from "drizzle-orm/pg-core";
import { user, organization } from "./Schema/auth";

export const essentials = {
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "no action",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by").references(() => user.id, {
    onDelete: "no action",
    onUpdate: "cascade",
  }),
};

export const orgInfo = {
  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
};
