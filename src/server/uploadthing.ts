import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

const f = createUploadthing();

export const ourFileRouter = {
  // Document uploader for case documents
  caseDocumentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    image: { maxFileSize: "8MB", maxFileCount: 10 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
    "text/plain": { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerAuthSession();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Store the uploaded file info in the database
      await db.document.create({
        data: {
          filename: file.name,
          originalName: file.name,
          url: file.url,
          size: file.size,
          mimeType: file.type,
          folder: "OTHER", // Default folder
          caseId: "", // Will be updated when associated with a case
          uploadedById: metadata.userId,
        },
      });

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),

  // Avatar uploader for user profiles
  avatarUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerAuthSession();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Update user's avatar URL
      await db.user.update({
        where: { id: metadata.userId },
        data: { image: file.url },
      });

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),

  // Invoice/receipt uploader
  invoiceUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerAuthSession();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized");
      }

      // Check if user has permission to upload invoices
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !["STAFF", "LEGAL", "ADMIN"].includes(user.role)) {
        throw new UploadThingError("Insufficient permissions");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Invoice upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
