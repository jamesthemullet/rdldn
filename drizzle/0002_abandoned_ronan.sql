CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_slug" text NOT NULL,
	"post_title" text NOT NULL,
	"post_rating" numeric,
	"visited_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "visits_user_id_post_slug_unique" UNIQUE("user_id","post_slug")
);
--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;