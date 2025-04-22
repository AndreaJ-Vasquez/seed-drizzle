import {
    pgSchema,
    uuid,
    timestamp,
    varchar,
    text,
    primaryKey,
    boolean,
    integer,
  } from "drizzle-orm/pg-core";
  import { essentials } from "../db-utils";
  import { user } from "./auth";
  import { rooms, roomSchema } from "./rooms";
  import { getTableColumns, sql } from "drizzle-orm";
  
  export const eventSchema = pgSchema("events");
  
  /**
   * Events Table
   *
   * Represents calendar events with start and end times, title, and recurrence settings.
   * Events can be one-time or recurring with various frequency patterns.
   */
  export const events = eventSchema.table("events", {
    id: uuid("id").primaryKey().defaultRandom(),
    start: timestamp("start", { withTimezone: false }).notNull(),
    end: timestamp("end", { withTimezone: false }).notNull(),
    title: text("title").notNull(),
    extendable: boolean("extendable").notNull().default(false),
    notes: text("notes"),
    googleLink: text("google_link"),
    recurring: boolean("recurring").notNull().default(false),
    recurrenceFrequency: varchar("recurrence_frequency", {
      enum: ["daily", "weekly", "monthly", "yearly"],
    }),
    recurrenceInterval: integer("recurrence_interval").default(1), // e.g., every 2 weeks
    recurrenceDaysOfWeek: integer("recurrence_days_of_week").array(), // 0-6 for Sunday-Saturday
    recurrenceDaysOfMonth: integer("recurrence_days_of_month").array(), // 1-31
    recurrenceMonthsOfYear: integer("recurrence_months_of_year").array(), // 1-12
    // End conditions
    recurrenceEndDate: timestamp("recurrence_end_date", { withTimezone: false }),
    recurrenceOccurrences: integer("recurrence_occurrences"), // Number of occurrences
    status: varchar("status", {
      enum: ["active", "cancelled"],
    }).default("active"),
    reocurranceApprovalStatus: varchar("reocurrance_approval_status", {
      enum: ["pending", "approved", "rejected"],
    }).default("pending"),
    reocurranceApprovedBy: text("reocurrance_approved_by").references(
      () => user.id
    ),
    reocurranceApprovedAt: timestamp("reocurrance_approved_at", {
      withTimezone: false,
    }),
  });
  
  /**
   * Recurring Exceptions Table
   *
   * Handles exceptions for recurring events, such as modified or cancelled occurrences.
   * Tracks both one-time modifications and recurring pattern changes.
   */
  export const recurringExceptions = eventSchema.table(
    "recurring_exceptions",
    {
      id: uuid("id").defaultRandom(),
      eventId: uuid("event_id").references(() => events.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
      originalGoogleLink: text("original_google_link"),
      originalStart: timestamp("original_start", {
        withTimezone: false,
      }).notNull(),
      originalEnd: timestamp("original_end", { withTimezone: false }).notNull(),
      // If null, this occurrence is cancelled
      newGoogleLink: text("new_google_link"),
      newStart: timestamp("new_start", { withTimezone: false }),
      newEnd: timestamp("new_end", { withTimezone: false }),
      // If true, this is a one-time modification. If false, this is a recurring modification
      isRecurring: boolean("is_recurring").notNull().default(true),
      // For recurring modifications, specify the pattern
      recurrenceFrequency: varchar("recurrence_frequency", {
        enum: ["daily", "weekly", "monthly", "yearly"],
      }),
      recurrenceInterval: integer("recurrence_interval").default(1),
      recurrenceDaysOfWeek: integer("recurrence_days_of_week").array(),
      recurrenceDaysOfMonth: integer("recurrence_days_of_month").array(),
      recurrenceMonthsOfYear: integer("recurrence_months_of_year").array(),
      recurrenceEndDate: timestamp("recurrence_end_date", {
        withTimezone: false,
      }),
      recurrenceOccurrences: integer("recurrence_occurrences"),
      ...essentials,
    },
    (t) => [primaryKey({ columns: [t.eventId, t.originalStart] })]
  );
  
  /**
   * Participants Table
   *
   * Tracks users who are participants in events with their permissions and status.
   * Each participant can have different permission levels (read, write, manage, etc.).
   */
  export const participants = eventSchema.table(
    "participants",
    {
      id: uuid("id").defaultRandom(),
      eventId: uuid("event_id").references(() => events.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
      userId: text("user_id").references(() => user.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
      permissions: varchar("permissions", {
        enum: ["read", "write", "manage", "owner", "invite"],
      })
        .array()
        .notNull()
        .default(["read"]),
      status: varchar("status", {
        enum: ["active", "inactive", "archived"],
      }).default("active"),
      ...essentials,
    },
    (t) => [primaryKey({ columns: [t.eventId, t.userId, t.id] })]
  );
  
  /**
   * Invitations Table
   *
   * Manages invitations to events for external guests.
   * Tracks who has been invited to which events.
   */
  export const invitations = eventSchema.table(
    "invitations",
    {
      id: uuid("id").defaultRandom(),
      eventId: uuid("event_id").references(() => events.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
      guest: text("guest"),
      ...essentials,
    },
    (t) => [primaryKey({ columns: [t.eventId, t.id] })]
  );
  
  /**
   * Event Details Table
   *
   * Stores additional details about events, including room assignments.
   * Links events to specific rooms where they will take place.
   */
  export const eventDetails = eventSchema.table(
    "event_details",
    {
      id: uuid("id").defaultRandom(),
      eventId: uuid("event_id").references(() => events.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
      roomId: uuid("room_id").references(() => rooms.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
      ...essentials,
    },
    (t) => [primaryKey({ columns: [t.eventId, t.id, t.roomId] })]
  );
  
  /**
   * Room Events View
   *
   * A database view that provides a convenient way to access events associated with rooms.
   * Includes events that occur within a 30-day window (15 days before and after the current date).
   */
  export const roomEvents = roomSchema
    .view("room_events")
    .with({ securityInvoker: true })
    .as((qb) => {
      const roomColumns = getTableColumns(rooms);
  
      return qb
        .select({
          ...roomColumns,
          events: sql<(typeof events.$inferSelect)[]>`
        (
          SELECT COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', e.id,
                'start', e.start,
                'end', e.end,
                'title', e.title,
                'notes', e.notes,
                'googleLink', e.google_link,
                'recurring', e.recurring,
                'recurrenceFrequency', e.recurrence_frequency,
                'recurrenceInterval', e.recurrence_interval,
                'recurrenceDaysOfWeek', e.recurrence_days_of_week,
                'recurrenceDaysOfMonth', e.recurrence_days_of_month,
                'recurrenceMonthsOfYear', e.recurrence_months_of_year,
                'recurrenceEndDate', e.recurrence_end_date,
                'recurrenceOccurrences', e.recurrence_occurrences,
                'status', e.status
              )
            ), '[]'::json
          )
          FROM ${events} AS e
          JOIN ${eventDetails} AS ed ON ed.event_id = e.id
          WHERE ed.room_id = ${rooms}.id
          AND e.start BETWEEN CURRENT_DATE - INTERVAL '15 days'
                          AND CURRENT_DATE + INTERVAL '15 days'
        )
      `.as("events"),
        })
        .from(rooms);
    });
  