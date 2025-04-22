
// import { integer, pgTable, varchar, serial, text, date, pgSchema} from "drizzle-orm/pg-core";

// export const articuloTable = pgTable("Articulo", {
//     uuid: serial().primaryKey(),
//     nombre_articulo: varchar({ length: 255 }).notNull(),
//     precio: integer().notNull(),
//     decripcion: text()
// })

// export const ventaTable = pgTable("Venta", {
//     uuid: serial().primaryKey(),
//     fecha_venta: date(),
//     uuid_articulo: serial().notNull(),
// }) 



// export const customSchema = pgSchema("Test");

// export const articule = customSchema.table("Articulo", {
//     uuid: serial().primaryKey(),
//     nombre_articulo: varchar({ length: 255 }).notNull(),
//     precio: integer().notNull(),
//     decripcion: text()
// })

import { varchar } from "drizzle-orm/mysql-core";
import {AnyPgColumn} from "drizzle-orm/pg-core";
import {pgEnum, pgTable as table} from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["guest", "user", "admin"]);

export const users = table("users", {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    firstName: t.varchar("firts_name", { length: 255}),
    lastName: t.varchar("last_name", { length: 255}),
    email: t.varchar().notNull().unique(),
    invitee: rolesEnum().default("guest")
},
(table) => [
    t.uniqueIndex("email_idx").on(table.email)
]
);

export const posts = table(
    "posts",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        slug: t.varchar().$default(() => generateUniqueString(16)),
        title: t.varchar({ length: 256 }),
        ownerId: t.integer("owner_id").references(() => users.id),
    },
    (table) => [
        t.uniqueIndex("slug_idx").on(table.slug),
        t.index("title_idx").on(table.title),
      ]
)

export const comments = table("comments", {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    text: t.varchar({ length: 256 }),
    postId: t.integer("post_id").references(() => posts.id),
    ownerId: t.integer("owner_id").references(() => users.id),
  });

function generateUniqueString(length: number = 12): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uniqueString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueString += characters[randomIndex];
  }

  return uniqueString;
}

