import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SFNClient } from '@aws-sdk/client-sfn';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from '../config.js';

const region = env.AWS_REGION;

export const s3Client = new S3Client({ region });
export const sfnClient = new SFNClient({ region });
export const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
export const bedrockClient = new BedrockRuntimeClient({ region });
