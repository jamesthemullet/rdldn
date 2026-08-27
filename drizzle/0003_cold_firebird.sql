ALTER TABLE "users" ADD COLUMN "leaderboard_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "leaderboard_display_name" text;