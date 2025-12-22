import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import Database from "better-sqlite3";

export const auth = betterAuth({
    database: new Database("auth.db"),
    secret: process.env.BETTER_AUTH_SECRET || "a-very-long-secret-for-build-step-32-chars",
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        jwt({
            jwt: {
                issuer: "better-auth",
                audience: "todo-app",
            }
        })
    ],
});
