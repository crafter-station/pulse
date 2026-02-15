import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const commits = pgTable("commits", {
	id: text("id").primaryKey(),
	repoName: text("repo_name").notNull(),
	authorUsername: text("author_username").notNull(),
	authorAvatarUrl: text("author_avatar_url"),
	message: text("message").notNull(),
	additions: integer("additions").default(0),
	deletions: integer("deletions").default(0),
	commitUrl: text("commit_url").notNull(),
	pushedAt: timestamp("pushed_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const repos = pgTable("repos", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique(),
	fullName: text("full_name").notNull(),
	isActive: boolean("is_active").default(true),
	isPrivate: boolean("is_private").default(false),
	lastPushAt: timestamp("last_push_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const contributors = pgTable("contributors", {
	id: serial("id").primaryKey(),
	username: text("username").notNull().unique(),
	avatarUrl: text("avatar_url"),
	totalCommits: integer("total_commits").default(0),
	lastCommitAt: timestamp("last_commit_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const weeklyLeaderboards = pgTable("weekly_leaderboards", {
	id: serial("id").primaryKey(),
	year: integer("year").notNull(),
	week: integer("week").notNull(), // ISO week number
	username: text("username").notNull(),
	avatarUrl: text("avatar_url"),
	commits: integer("commits").notNull(),
	additions: integer("additions").default(0),
	deletions: integer("deletions").default(0),
	rank: integer("rank").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});
