// Domain interfaces for DynamoDB-backed entities

export type UserId = string;

export interface User {
  id: UserId;
  createTime: number; // epoch seconds
  email: string;
  name: string;
  phone: string;
}

export interface Following {
  userId: UserId; // the user being followed
  followerId: UserId; // the follower
}

export interface CheckIn {
  userId: UserId;
  location: string;
  time: number; // epoch seconds
  users: UserId[]; // other users present
}


