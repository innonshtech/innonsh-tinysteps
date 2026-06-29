/**
 * lib/db.ts
 * Transitioned away from Mongoose.
 * This is a dummy connectDB function to prevent breaking old imports
 * that haven't been fully removed yet.
 */
export async function connectDB() {
  if (process.env.NODE_ENV !== 'production') {
    // console.log("[connectDB] Notice: MongoDB is deprecated. Using Supabase Postgres instead.");
  }
  return true;
}
