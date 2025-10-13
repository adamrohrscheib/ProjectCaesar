import Constants from 'expo-constants';
import AWS from 'aws-sdk';
import type { CheckIn, Following, User } from '@/app/interfaces';

type AwsRuntimeConfig = {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  usersTable?: string;
  followingTable?: string;
  checkInsTable?: string;
};

let documentClientSingleton: AWS.DynamoDB.DocumentClient | null = null;

function getAwsConfig(): AwsRuntimeConfig {
  const extra = (Constants.expoConfig as any)?.extra ?? {};
  const awsExtra = extra.aws ?? {};
  return {
    region:
      process.env.EXPO_PUBLIC_AWS_REGION ||
      awsExtra.region ||
      'us-east-2',
    accessKeyId:
      process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || awsExtra.accessKeyId,
    secretAccessKey:
      process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY || awsExtra.secretAccessKey,
    usersTable:
      process.env.EXPO_PUBLIC_DDB_USERS_TABLE ||
      awsExtra.usersTable ||
      'ProjectCaesar_Users',
    followingTable:
      process.env.EXPO_PUBLIC_DDB_FOLLOWING_TABLE ||
      awsExtra.followingTable ||
      'ProjectCaesar_Following',
    checkInsTable:
      process.env.EXPO_PUBLIC_DDB_CHECKINS_TABLE ||
      awsExtra.checkInsTable ||
      'ProjectCaesar_Check-Ins',
  };
}

export function getDocumentClient(): AWS.DynamoDB.DocumentClient {
  if (documentClientSingleton) return documentClientSingleton;
  const cfg = getAwsConfig();

  AWS.config.update({
    region: cfg.region,
    credentials:
      cfg.accessKeyId && cfg.secretAccessKey
        ? new AWS.Credentials({
            accessKeyId: cfg.accessKeyId,
            secretAccessKey: cfg.secretAccessKey,
          })
        : AWS.config.credentials,
  });

  documentClientSingleton = new AWS.DynamoDB.DocumentClient({
    convertEmptyValues: true,
  });
  return documentClientSingleton;
}

export const Tables = {
  users: () => getAwsConfig().usersTable!,
  following: () => getAwsConfig().followingTable!,
  checkIns: () => getAwsConfig().checkInsTable!,
};

export async function fetchUserById(id: string): Promise<User | null> {
  const ddb = getDocumentClient();
  const res = await ddb
    .get({ TableName: Tables.users(), Key: { id } })
    .promise();
  const item = res.Item as any;
  if (!item) return null;
  return {
    id: String(item.id),
    createTime: Number(item.createTime),
    email: String(item.email),
    name: String(item.name),
    phone: String(item.phone),
  } satisfies User;
}

export async function fetchFollowingByUserId(
  userId: string
): Promise<Following[]> {
  const ddb = getDocumentClient();
  const res = await ddb
    .query({
      TableName: Tables.following(),
      KeyConditionExpression: '#uid = :uid',
      ExpressionAttributeNames: { '#uid': 'userId' },
      ExpressionAttributeValues: { ':uid': userId },
    })
    .promise();
  const items = (res.Items ?? []) as any[];
  return items.map((it) => ({
    userId: String(it.userId),
    followerId: String(it.followerId),
  }));
}

export async function fetchCheckInsByUserId(
  userId: string
): Promise<CheckIn[]> {
  const ddb = getDocumentClient();
  const res = await ddb
    .query({
      TableName: Tables.checkIns(),
      KeyConditionExpression: '#uid = :uid',
      ExpressionAttributeNames: { '#uid': 'userId' },
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
    })
    .promise();
  const items = (res.Items ?? []) as any[];
  return items.map((it) => ({
    userId: String(it.userId),
    location: String(it.location),
    time: Number(it.time),
    users: Array.isArray(it.users) ? it.users.map((u: any) => String(u)) : [],
  }));
}


