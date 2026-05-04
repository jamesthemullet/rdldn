import { numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postSlug: text("post_slug").notNull(),
    postTitle: text("post_title").notNull(),
    postRating: numeric("post_rating"),
    savedAt: timestamp("saved_at").defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.postSlug)]
);

export type User = typeof users.$inferSelect;
export type WishlistItem = typeof wishlistItems.$inferSelect;
