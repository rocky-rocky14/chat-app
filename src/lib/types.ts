export interface User {
  id: string;
  displayName: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  _count?: { members: number; channels: number };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
  user: User;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: "public" | "dm";
  createdAt: string;
  otherUser?: User;
  unreadCount?: number;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: User;
}
