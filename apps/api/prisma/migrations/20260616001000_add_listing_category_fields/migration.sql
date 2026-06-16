ALTER TABLE "Listing" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Listing" ADD COLUMN "lostFoundLocation" TEXT;
ALTER TABLE "Listing" ADD COLUMN "lostFoundOccurredAt" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN "lostFoundStatus" TEXT;
ALTER TABLE "Listing" ADD COLUMN "academicExternalLink" TEXT;
ALTER TABLE "Listing" ADD COLUMN "academicSubject" TEXT;
ALTER TABLE "Listing" ADD COLUMN "academicProfessor" TEXT;
ALTER TABLE "Listing" ADD COLUMN "academicTerm" TEXT;
