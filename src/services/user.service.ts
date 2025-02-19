import { Storage } from "@google-cloud/storage";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = new Storage({
    keyFilename: path.join(
        __dirname,
        process.env.GCLOUD_CREDENTIALS_PATH as string,
    ),
    projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME as string);

export const uploadImageToGCS = (file: Express.Multer.File) => {
    return new Promise((resolve, reject) => {
        const blob = bucket.file(Date.now() + "-" + file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on("error", (err) => reject(err));

        blobStream.on("finish", () => {
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(imageUrl);
        });

        blobStream.end(file.buffer);
    });
};
