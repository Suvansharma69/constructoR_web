/**
 * env.ts — MUST be the very first import in server.ts
 * Loads .env before any other module reads process.env
 */
import dotenv from 'dotenv'
dotenv.config()
