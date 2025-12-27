
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function configureCors() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
    console.error('Missing AWS configuration variables');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const corsRules = [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['PUT', 'POST', 'GET', 'HEAD', 'DELETE'],
      AllowedOrigins: [
        'http://localhost:5173', // Frontend (Customer/Shop)
        'http://localhost:3000', // Backend default
        'http://localhost:5000', // Backend modified
        '*' // Optional: allow all for dev
      ],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3000
    },
  ];

  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: corsRules,
      },
    });

    await s3Client.send(command);
    console.log(`Successfully configured CORS for bucket: ${bucketName}`);
  } catch (error) {
    console.error('Error configuring CORS:', error);
    process.exit(1);
  }
}

configureCors();
