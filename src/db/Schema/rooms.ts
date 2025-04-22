import {
  pgSchema,
  uuid,
  text,
  boolean,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { essentials, orgInfo } from "../db-utils";

export const roomSchema = pgSchema("rooms");

/**
 * Rooms Table
 *
 * Represents physical spaces that can be booked for events.
 * Includes details about room capacity, amenities, type, and status.
 * Rooms are associated with organizations and have row-level security policies.
 *
 * @param {id} uuid - The unique identifier for the room.
 * @param {name} varchar - The name of the room.
 * @param {description} text - The description of the room.
 * @param {amenities} text[] - The amenities of the room.
 * @param {capacity} integer - The capacity of the room.
 * @param {enabled} boolean - Whether the room is enabled.
 * @param {type} varchar - The type of the room (meeting, class, training, studio, lounge, game, break, lab, library, workshop, other).
 * @param {status} varchar - The status of the room (active, inactive, maintenance, archived, deleted, remodelling).
 * @param {floorId} uuid - The unique identifier for the floor that the room belongs to.
 * @param {metadata} jsonb - Additional metadata about the room.
 * @param {createdAt} timestamp - The timestamp of when the room was created.
 * @param {updatedAt} timestamp - The timestamp of when the room was last updated.
 * @param {createdBy} uuid - The unique identifier for the user that created the room.
 * @param {updatedBy} uuid - The unique identifier for the user that last updated the room.
 * @param {organizationId} uuid - The unique identifier for the organization that the room belongs to.
 */
export const rooms = roomSchema.table("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  amenities: text("amenities").array(),
  capacity: integer("capacity").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  type: varchar("room_type", {
    enum: [
      "meeting",
      "class",
      "training",
      "studio",
      "lounge",
      "game",
      "break",
      "lab",
      "library",
      "workshop",
      "other",
    ],
  }).default("meeting"),
  status: varchar("status", {
    enum: [
      "active",
      "inactive",
      "maintenance",
      "archived",
      "deleted",
      "remodelling",
    ],
  }).default("active"),
  floorId: uuid("floor_id")
    .notNull()
    .references(() => floors.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  metadata: jsonb("metadata"),
  ...essentials,
  ...orgInfo,
});

/**
 * Floors Table
 *
 * Represents physical floors in a building.
 * Each floor is associated with a building and has metadata.
 *
 * @param {id} uuid - The unique identifier for the floor.
 * @param {name} text - The name of the floor.
 * @param {buildingId} uuid - The unique identifier for the building that the floor belongs to.
 * @param {metadata} jsonb - Additional metadata about the floor.
 * @param {createdAt} timestamp - The timestamp of when the floor was created.
 * @param {updatedAt} timestamp - The timestamp of when the floor was last updated.
 * @param {createdBy} uuid - The unique identifier for the user that created the floor.
 * @param {updatedBy} uuid - The unique identifier for the user that last updated the floor.
 * @param {organizationId} uuid - The unique identifier for the organization that the floor belongs to.
 */
export const floors = roomSchema.table("floors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  buildingId: uuid("building_id")
    .notNull()
    .references(() => buildings.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  metadata: jsonb("metadata"),
  ...essentials,
  ...orgInfo,
});

/**
 * Buildings Table
 *
 * Represents physical buildings.
 * Each building has a name and metadata.
 *
 * @param {id} uuid - The unique identifier for the building.
 * @param {name} text - The name of the building.
 * @param {metadata} jsonb - Additional metadata about the building.
 * @param {createdAt} timestamp - The timestamp of when the building was created.
 * @param {updatedAt} timestamp - The timestamp of when the building was last updated.
 * @param {createdBy} uuid - The unique identifier for the user that created the building.
 * @param {updatedBy} uuid - The unique identifier for the user that last updated the building.
 * @param {organizationId} uuid - The unique identifier for the organization that the building belongs to.
 */
export const buildings = roomSchema.table("buildings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  metadata: jsonb("metadata"),
  ...essentials,
  ...orgInfo,
});

/**
 * Room Rules Table
 *
 * Defines scheduling rules for rooms, such as availability windows.
 * Specifies when a room can be booked based on day of week and time ranges.
 *
 * @param {id} uuid - The unique identifier for the floor.
 * @param {roomId} uuid - The unique identifier for the room that the rule belongs to.
 * @param {startTime} timestamp - The start time of the rule.
 * @param {endTime} timestamp - The end time of the rule.
 * @param {dayOfWeek} integer - The day of week of the rule.
 * @param {essentials} timestamp - The timestamp of when the rule was created and last updated.
 */
export const roomRules = roomSchema.table("rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .references(() => rooms.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  startTime: timestamp("start_time", { withTimezone: false }).notNull(),
  endTime: timestamp("end_time", { withTimezone: false }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  ...essentials,
});
