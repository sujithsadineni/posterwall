CREATE TYPE "public"."language" AS ENUM('english', 'uk', 'hindi', 'telugu', 'tamil');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "movie_title" varchar(120) NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "release_year" smallint;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "language" "language" NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "rating" smallint;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "poster_path" text;--> statement-breakpoint
CREATE INDEX "posts_language_feed" ON "posts" USING btree ("language","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_rating_1_to_5" CHECK ("posts"."rating" between 1 and 5);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_release_year" CHECK ("posts"."release_year" between 1888 and 2100);