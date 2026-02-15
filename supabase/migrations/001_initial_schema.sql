-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  custom_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servers
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon_url TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Server Members
CREATE TABLE server_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- Channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  reply_to_id UUID REFERENCES messages(id),
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (DMs)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT DEFAULT 'dm' CHECK (type IN ('dm', 'group')),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Members
CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Direct Messages
CREATE TABLE dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create indexes for performance
CREATE INDEX idx_messages_channel_id_created_at ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_author_id ON messages(author_id);
CREATE INDEX idx_dm_messages_conversation_id ON dm_messages(conversation_id, created_at DESC);
CREATE INDEX idx_server_members_server_id ON server_members(server_id);
CREATE INDEX idx_server_members_user_id ON server_members(user_id);
CREATE INDEX idx_conversation_members_conversation_id ON conversation_members(conversation_id);
CREATE INDEX idx_friends_requester_id ON friends(requester_id);
CREATE INDEX idx_friends_addressee_id ON friends(addressee_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Servers RLS
CREATE POLICY "Users can view servers they are members of"
  ON servers FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT server_id FROM server_members WHERE user_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

CREATE POLICY "Users can create servers"
  ON servers FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Server owners can update their servers"
  ON servers FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Server Members RLS
CREATE POLICY "Users can view members of their servers"
  ON server_members FOR SELECT
  TO authenticated
  USING (
    server_id IN (
      SELECT server_id FROM server_members WHERE user_id = auth.uid()
    )
  );

-- Channels RLS
CREATE POLICY "Users can view channels of their servers"
  ON channels FOR SELECT
  TO authenticated
  USING (
    server_id IN (
      SELECT server_id FROM server_members WHERE user_id = auth.uid()
    )
  );

-- Messages RLS
CREATE POLICY "Users can view messages in their channels"
  ON messages FOR SELECT
  TO authenticated
  USING (
    channel_id IN (
      SELECT c.id FROM channels c
      JOIN server_members sm ON c.server_id = sm.server_id
      WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Conversations RLS
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- Conversation Members RLS
CREATE POLICY "Users can view members of their conversations"
  ON conversation_members FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- DM Messages RLS
CREATE POLICY "Users can view DM messages in their conversations"
  ON dm_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert DM messages"
  ON dm_messages FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Friends RLS
CREATE POLICY "Users can view their friends"
  ON friends FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
  );

CREATE POLICY "Users can send friend requests"
  ON friends FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());
