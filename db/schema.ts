// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  protocol: text("protocol").notNull().unique(),
  authorName: text("author_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  biography: text("biography").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  category: text("category").notNull(),
  synopsis: text("synopsis").notNull(),
  audience: text("audience").notNull(),
  differentiator: text("differentiator").notNull(),
  stage: text("stage").notNull(),
  wordCount: text("word_count").notNull().default(""),
  rightsConfirmed: integer("rights_confirmed", { mode: "boolean" }).notNull(),
  coverAvailable: integer("cover_available", { mode: "boolean" }).notNull(),
  reviewerOne: text("reviewer_one").notNull().default(""),
  reviewerTwo: text("reviewer_two").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("recebida"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  publicationYear: integer("publication_year").notNull(),
  isbn: text("isbn").notNull().default(""),
  coverUrl: text("cover_url").notNull().default(""),
  purchaseUrl: text("purchase_url").notNull().default(""),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const booksPublishedIndex = { name: "idx_books_published", columns: [books.published] };
export {};
