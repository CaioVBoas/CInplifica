-- AlterTable
ALTER TABLE "_UserConversations" ADD CONSTRAINT "_UserConversations_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserConversations_AB_unique";
