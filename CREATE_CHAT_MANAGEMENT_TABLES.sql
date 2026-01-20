-- Create chat_starred table
CREATE TABLE IF NOT EXISTS chat_starred (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

-- Create chat_archived table
CREATE TABLE IF NOT EXISTS chat_archived (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_starred_user_id ON chat_starred(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_starred_conversation_id ON chat_starred(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_archived_user_id ON chat_archived(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_archived_conversation_id ON chat_archived(conversation_id);

-- Enable RLS
ALTER TABLE chat_starred ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_archived ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_starred
CREATE POLICY "Users can manage their own starred chats" ON chat_starred
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_archived
CREATE POLICY "Users can manage their own archived chats" ON chat_archived
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
