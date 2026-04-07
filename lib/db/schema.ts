import {
	pgTable,
	text,
	serial,
	integer,
	boolean,
	timestamp,
	uniqueIndex,
	index,
} from "drizzle-orm/pg-core";

export const orgs = pgTable("orgs", {
	id: serial("id").primaryKey(),
	slug: text("slug").notNull().unique(),
	displayName: text("display_name").notNull(),
	githubOrg: text("github_org").notNull().unique(),
	skillsShOrg: text("skills_sh_org"),
	description: text("description"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
});

export const commits = pgTable(
	"commits",
	{
		id: text("id").primaryKey(),
		orgId: integer("org_id").references(() => orgs.id),
		repoName: text("repo_name").notNull(),
		authorUsername: text("author_username").notNull(),
		authorAvatarUrl: text("author_avatar_url"),
		message: text("message").notNull(),
		additions: integer("additions").default(0),
		deletions: integer("deletions").default(0),
		commitUrl: text("commit_url").notNull(),
		pushedAt: timestamp("pushed_at").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => ({
		orgIdx: index("commits_org_idx").on(t.orgId),
		pushedAtIdx: index("commits_pushed_at_idx").on(t.pushedAt),
	}),
);

export const repos = pgTable(
	"repos",
	{
		id: serial("id").primaryKey(),
		orgId: integer("org_id").references(() => orgs.id),
		name: text("name").notNull(),
		fullName: text("full_name").notNull(),
		isActive: boolean("is_active").default(true),
		isPrivate: boolean("is_private").default(false),
		lastPushAt: timestamp("last_push_at"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => ({
		orgNameUnique: uniqueIndex("repos_org_name_unique").on(t.orgId, t.name),
	}),
);

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
	week: integer("week").notNull(),
	username: text("username").notNull(),
	avatarUrl: text("avatar_url"),
	commits: integer("commits").notNull(),
	additions: integer("additions").default(0),
	deletions: integer("deletions").default(0),
	rank: integer("rank").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export const packages = pgTable(
	"packages",
	{
		id: serial("id").primaryKey(),
		orgId: integer("org_id")
			.references(() => orgs.id)
			.notNull(),
		slug: text("slug").notNull().unique(),
		npmName: text("npm_name"),
		githubRepo: text("github_repo"),
		skillsSlug: text("skills_slug"),
		displayName: text("display_name").notNull(),
		description: text("description"),
		category: text("category"),
		monorepo: text("monorepo"),
		isActive: boolean("is_active").default(true),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => ({
		orgIdx: index("packages_org_idx").on(t.orgId),
		monorepoIdx: index("packages_monorepo_idx").on(t.monorepo),
	}),
);

export const packageStats = pgTable(
	"package_stats",
	{
		id: serial("id").primaryKey(),
		packageId: integer("package_id")
			.references(() => packages.id)
			.notNull(),
		source: text("source").notNull(),
		metric: text("metric").notNull(),
		value: integer("value").notNull(),
		capturedAt: timestamp("captured_at").defaultNow().notNull(),
	},
	(t) => ({
		pkgSourceCapturedIdx: index("package_stats_pkg_source_captured_idx").on(
			t.packageId,
			t.source,
			t.capturedAt,
		),
		capturedAtIdx: index("package_stats_captured_at_idx").on(t.capturedAt),
	}),
);
