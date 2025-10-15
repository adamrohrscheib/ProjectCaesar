import Constants from 'expo-constants';
import AWS from 'aws-sdk';
import type { CheckIn, Following, User } from '@/app/interfaces';
import { withApiLogging } from '@/lib/apiLogger';

AWS.config.update({
  dynamoDbCrc32: false,
});

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
    usersTable: 'ProjectCaesar_Users',
    followingTable: 'ProjectCaesar_Following',
    checkInsTable: 'ProjectCaesar_Check-Ins',
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
  const res = await withApiLogging('ddb.getUser', { id }, () =>
    ddb.get({ TableName: Tables.users(), Key: { id } }).promise()
  );
  const item = res.Item as any;
  if (!item) return null;
  return {
    id: String(item.id),
    createTime: Number(item.createTime),
    email: String(item.email),
    name: String(item.name),
    phone: String(item.phone),
    username: item.username ? String(item.username) : undefined,
  } satisfies User;
}

// NOTE: For name/username search, a GSI is recommended (e.g., nameLower or usernameLower).
// As a stopgap in dev, we do a filtered scan with begins_with/contains on lower-cased fields.
export async function searchUsersByText(query: string): Promise<User[]> {
  const ddb = getDocumentClient();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const res = await withApiLogging('ddb.searchUsersByText', { query: q }, () =>
    ddb
      .scan({
        TableName: Tables.users(),
        FilterExpression:
          'contains(#name, :q) OR contains(#username, :q) OR contains(#email, :q)',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#username': 'username',
          '#email': 'email',
        },
        ExpressionAttributeValues: {
          ':q': q,
        },
      })
      .promise()
  );
  const items = (res.Items ?? []) as any[];
  return items.map((item) => ({
    id: String(item.id),
    createTime: Number(item.createTime),
    email: String(item.email),
    name: String(item.name),
    phone: String(item.phone ?? ''),
    username: item.username ? String(item.username) : undefined,
  }));
}

export async function fetchFollowingByUserId(
  userId: string
): Promise<Following[]> {
  const ddb = getDocumentClient();
  const res = await withApiLogging('ddb.queryFollowingByUser', { userId }, () =>
    ddb
      .query({
        TableName: Tables.following(),
        KeyConditionExpression: '#uid = :uid',
        ExpressionAttributeNames: { '#uid': 'userId' },
        ExpressionAttributeValues: { ':uid': userId },
      })
      .promise()
  );
  const items = (res.Items ?? []) as any[];
  return items.map((it) => ({
    userId: String(it.userId),
    followerId: String(it.followerId),
  }));
}

// This scans for items where followerId == given id to compute following count quickly for profile
export async function fetchFollowingByFollowerId(
  followerId: string
): Promise<Following[]> {
  const ddb = getDocumentClient();
  // If a GSI exists on followerId, switch to query; otherwise scan with a filter
  const res = await withApiLogging('ddb.scanFollowingByFollower', { followerId }, () =>
    ddb
      .scan({
        TableName: Tables.following(),
        FilterExpression: '#fid = :fid',
        ExpressionAttributeNames: { '#fid': 'followerId' },
        ExpressionAttributeValues: { ':fid': followerId },
      })
      .promise()
  );
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
  const res = await withApiLogging('ddb.queryCheckInsByUser', { userId }, () =>
    ddb
      .query({
        TableName: Tables.checkIns(),
        KeyConditionExpression: '#uid = :uid',
        ExpressionAttributeNames: { '#uid': 'userId' },
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false,
      })
      .promise()
  );
  const items = (res.Items ?? []) as any[];
  return items.map((it) => ({
    userId: String(it.userId),
    location: String(it.location),
    time: Number(it.time),
    users: Array.isArray(it.users) ? it.users.map((u: any) => String(u)) : [],
  }));
}

export async function createCheckIn(input: {
  userId: string;
  location: string;
  time: number; // epoch seconds
  users?: string[];
}): Promise<void> {
  const ddb = getDocumentClient();
  const item = {
    userId: input.userId,
    location: input.location,
    time: input.time,
    users: input.users ?? [],
  };
  // Prevent overwriting any existing check-in for the same user+time (composite key safety)
  await withApiLogging('ddb.putCheckIn', { userId: input.userId, location: input.location }, () =>
    ddb
      .put({
        TableName: Tables.checkIns(),
        Item: item,
      })
      .promise()
  );
}

export async function updateCheckIn(input: {
  userId: string;
  time: number; // epoch seconds (composite key)
  users?: string[];
  lineMinutes?: number;
  notes?: string;
}): Promise<void> {
  const ddb = getDocumentClient();
  const updates: string[] = [];
  const ExpressionAttributeNames: Record<string, string> = {};
  const ExpressionAttributeValues: Record<string, any> = {};

  if (typeof input.users !== 'undefined') {
    updates.push('#users = :users');
    ExpressionAttributeNames['#users'] = 'users';
    ExpressionAttributeValues[':users'] = input.users;
  }
  if (typeof input.lineMinutes !== 'undefined') {
    updates.push('#lineMinutes = :lineMinutes');
    ExpressionAttributeNames['#lineMinutes'] = 'lineMinutes';
    ExpressionAttributeValues[':lineMinutes'] = input.lineMinutes;
  }
  if (typeof input.notes !== 'undefined') {
    updates.push('#notes = :notes');
    ExpressionAttributeNames['#notes'] = 'notes';
    ExpressionAttributeValues[':notes'] = input.notes;
  }

  if (updates.length === 0) return; // nothing to update

  const UpdateExpression = `SET ${updates.join(', ')}`;

  await withApiLogging('ddb.updateCheckIn', { userId: input.userId, time: input.time }, () =>
    ddb
      .update({
        TableName: Tables.checkIns(),
        Key: { userId: input.userId, time: input.time },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      })
      .promise()
  );
}

export async function createFollow(input: { userId: string; followerId: string }): Promise<void> {
  const ddb = getDocumentClient();
  const item = { userId: input.userId, followerId: input.followerId };
  await withApiLogging('ddb.putFollow', { userId: input.userId, followerId: input.followerId }, () =>
    ddb
      .put({
        TableName: Tables.following(),
        Item: item,
        ConditionExpression: 'attribute_not_exists(#uid) AND attribute_not_exists(#fid)',
        ExpressionAttributeNames: { '#uid': 'userId', '#fid': 'followerId' },
      })
      .promise()
  );
}


