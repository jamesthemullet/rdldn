CREATE TABLE "game_personal_bests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game" text NOT NULL,
	"score" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_personal_bests_user_id_game_unique" UNIQUE("user_id","game")
);
--> statement-breakpoint
ALTER TABLE "game_personal_bests" ADD CONSTRAINT "game_personal_bests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;