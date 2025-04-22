import { Client } from "pg";
import {user,
    account, 
    apikey, 
    invitation,
    member, 
    organization, 
    session,
    verification} from "./Schema/auth";
import {eventDetails, 
    eventSchema, 
    events, 
    invitations,
    participants, 
    recurringExceptions, 
    roomEvents} from "./Schema/events";
import {rooms, roomRules, roomSchema} from "./Schema/rooms";
import {
    integrationSchema,
    slack
} from "./Schema/integrations";
import {reset} from "drizzle-seed";
import { drizzle } from "drizzle-orm/node-postgres";

const client = new Client({
    user: "postgres",
    password: "123",
    host: "localhost",
    port: 5432,
    database: "calendar2",
})

async function main() {
    const db = drizzle(client);
    await client.connect();
    await reset(db, { user });
    await reset(db, {organization})
}

main()
    .then(() => console.log("Reset completed"))
    .catch((error) => console.error("Error resetting database:", error))
    .finally(() => client.end());