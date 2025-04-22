import * as dotenv from 'dotenv';
dotenv.config();

import { events, eventDetails } from './Schema/events';
import { user, organization } from './Schema/auth';   
import { drizzle } from 'drizzle-orm/node-postgres';
import { seed } from 'drizzle-seed';
import { Client } from 'pg';
import {buildings, rooms, floors, roomRules, roomSchema} from './Schema/rooms';

const userIds = Array.from({ length: 10 }, () => crypto.randomUUID());
const orgIds = Array.from({ length: 10 }, () => crypto.randomUUID());
const eventDetailsIds = Array.from({ length: 20}, ()=> crypto.randomUUID());
const roomsIds = Array.from({ length: 10}, ()=> crypto.randomUUID());
const eventIds = Array.from({ length: 20}, ()=> crypto.randomUUID());
const buildingIds = Array.from({ length: 3}, ()=> crypto.randomUUID());
const floorIds = Array.from({length: 5}, ()=> crypto.randomUUID());

const client = new Client({
    user: "postgres",
    password: "123", 
    host: "localhost",
    port: 5432,
    database: "calendar2",
  });

  async function fullSeed() {
    await client.connect();
    const db = drizzle(client);
  
    await seed(db, { user, organization }).refine((f) => ({
      user: {
        count: 10,
        columns: {
          id: f.valuesFromArray({ values: userIds, isUnique: true }),
          name: f.fullName(),
          emailVerified: f.default({ defaultValue: true }),
          image: f.default({
            defaultValue: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }),
          createdAt: f.date(),
          updatedAt: f.date(),
          role: f.default({ defaultValue: "user" }),
          banned: f.default({ defaultValue: false }),
          email: f.email(),
        },
      },
      organization: {
        count: 10,
        columns: {
          id: f.valuesFromArray({ values: orgIds, isUnique: true }),
          name: f.companyName(),
          slug: f.loremIpsum(),
          logo: f.default({
            defaultValue: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }),
          createdAt: f.date(),
          metadata: f.json(),
        },
      },
    }));
  
    await seed(db, { buildings, floors }).refine((f) => ({
      buildings: {
        count: 3,
        columns: {
          id: f.valuesFromArray({ values: buildingIds, isUnique: true }),
          name: f.companyName(),
          description: f.loremIpsum(),
          createdAt: f.date(),
          createdBy: f.valuesFromArray({ values: userIds }),
          updatedBy: f.valuesFromArray({ values: userIds }),
          organizationId: f.valuesFromArray({ values: orgIds }),
          updatedAt: f.date(),
          metadata: f.json(),
        },
      },
      floors: {
        count: 5,
        columns: {
          id: f.valuesFromArray({ values: floorIds, isUnique: true }),
          name: f.companyName(),
          description: f.loremIpsum(),
          createdAt: f.date(),
          createdBy: f.valuesFromArray({ values: userIds }),
          updatedBy: f.valuesFromArray({ values: userIds }),
          buildingId: f.valuesFromArray({ values: buildingIds }),
          updatedAt: f.date(),
          metadata: f.json(),
          organizationId: f.valuesFromArray({ values: orgIds }),
        },
      },
    }));
  
    await seed(db, { rooms, roomRules }).refine((f) => ({
      rooms: {
        count: 10,
        columns: {
          id: f.valuesFromArray({ values: roomsIds, isUnique: true }),
          name: f.firstName(),
          description: f.loremIpsum(),
          capacity: f.int(),
          enabled: f.default({ defaultValue: true }),
          status: f.default({ defaultValue: "available" }),
          details: f.json(),
          metadata: f.json(),
          createdBy: f.valuesFromArray({ values: userIds }),
          updatedBy: f.valuesFromArray({ values: userIds }),
          createdAt: f.date(),
          updatedAt: f.date(),
          organizationId: f.valuesFromArray({ values: orgIds }),
          floorId: f.valuesFromArray({ values: floorIds }),
          buildingId: f.valuesFromArray({ values: buildingIds }),
        },
      },
      roomRules: {
        columns: {
          id: f.uuid(),
          createdAt: f.date(),
          updatedAt: f.date(),
          createdBy: f.valuesFromArray({ values: userIds }),
          updatedBy: f.valuesFromArray({ values: userIds }),
          roomId: f.valuesFromArray({ values: roomsIds }),
          startTime: f.date(),
          endTime: f.date(),
        }
      }
    }));
  
    await seed(db, { events, eventDetails }).refine((f) => ({
      events: {
        count: 20,
        columns: {
          id: f.valuesFromArray({ values: eventIds, isUnique: true }),
          start: f.date(),
          end: f.date(),
          title: f.companyName(),
          notes: f.loremIpsum(),
          googleLink: f.default({ defaultValue: "https://google.com" }),
          recurring: f.default({ defaultValue: false }),
          status: f.default({ defaultValue: "available" }),
          extendable: f.default({ defaultValue: true }),
        },
      },
      eventDetails: {
        count: 20,
        columns: {
          id: f.valuesFromArray({ values: eventDetailsIds, isUnique: true }),
          eventId: f.valuesFromArray({ values: eventIds, isUnique: true }),
          createdAt: f.date(),
          updatedAt: f.date(),
          createdBy: f.valuesFromArray({ values: userIds }),
          updatedBy: f.valuesFromArray({ values: userIds }),
          roomId: f.valuesFromArray({ values: roomsIds }),
        },
      },
    }));
  
    console.log("✅ Seeding completo");
  }
  
  fullSeed().catch((err) => {
    console.error("❌ Error al hacer seed:", err);
  });
  
