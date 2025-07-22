import dotenv from "dotenv";
dotenv.config({ override: true, quiet: true });
export default process.env;
// for vercel
export const IS_PROD = process.env.VERCEL_ENV === "production";
