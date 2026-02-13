-- Migration: Add reaction_video_id to reaction_contracts

ALTER TABLE "reaction_contracts" 
ADD COLUMN IF NOT EXISTS "reaction_video_id" text;

COMMENT ON COLUMN "reaction_contracts"."reaction_video_id" IS 'ID of the video with which the user reacts (from videos table)';
