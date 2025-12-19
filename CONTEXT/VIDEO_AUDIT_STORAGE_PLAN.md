# Video Audit Storage & Follow-up Plan

## Why Store Audits?

1. **Training Data** - Learn what makes good advice
2. **User Value** - They can reference past audits
3. **Analytics** - See what types of videos get audited
4. **Feedback Loop** - Track if advice was helpful

## Database Schema

```sql
CREATE TABLE video_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Video info
  video_url TEXT,
  video_source TEXT, -- 'url' or 'upload'
  video_duration INTEGER, -- seconds
  
  -- Analysis
  initial_analysis JSONB, -- Full Gemini response
  analysis_model TEXT, -- 'gemini-2.0-flash' etc
  
  -- Conversation (follow-ups)
  conversation JSONB DEFAULT '[]', 
  -- Format: [{role: 'user'|'assistant', content: string, timestamp: string}]
  
  -- Feedback
  user_feedback TEXT, -- 'helpful', 'not_helpful', null
  feedback_comment TEXT, -- Optional text feedback
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_video_audits_user ON video_audits(user_id);
CREATE INDEX idx_video_audits_created ON video_audits(created_at DESC);

-- RLS
ALTER TABLE video_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audits" ON video_audits 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audits" ON video_audits 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own audits" ON video_audits 
  FOR UPDATE USING (auth.uid() = user_id);
```

## Usage Tracking

```sql
CREATE TABLE audit_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First of month, e.g., '2025-01-01'
  audits_used INTEGER DEFAULT 0,
  follow_ups_used INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_audit_usage(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_usage (user_id, month, audits_used)
  VALUES (p_user_id, date_trunc('month', CURRENT_DATE)::date, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET 
    audits_used = audit_usage.audits_used + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

## Follow-up Chat UI

The VideoAudit page would be updated to:

1. **After initial audit:** Show results + chat box below
2. **Chat box:** User can type follow-up questions
3. **Context:** Each follow-up includes original analysis as context
4. **Limit display:** "2/2 follow-ups used" based on tier

```tsx
// Simplified UI structure
<VideoAuditPage>
  <VideoInputSection />
  
  {auditResult && (
    <>
      <AuditResultsDisplay result={auditResult} />
      
      <FollowUpChat 
        auditId={auditResult.id}
        conversation={conversation}
        remainingFollowUps={remainingFollowUps}
        onSendMessage={handleFollowUp}
      />
      
      <FeedbackButtons 
        onFeedback={(rating) => saveRating(auditResult.id, rating)}
      />
    </>
  )}
</VideoAuditPage>
```

## API Changes

### Save Audit (new endpoint)
```typescript
// api/audit/save.ts
POST /api/audit/save
Body: { video_url, initial_analysis, video_duration }
Response: { id, created_at }
```

### Add Follow-up
```typescript
// api/audit/follow-up.ts
POST /api/audit/follow-up
Body: { audit_id, question }
Response: { answer, conversation }
```

### Get User's Audits
```typescript
// api/audit/history.ts
GET /api/audit/history
Response: { audits: [...], usage: { used: 5, limit: 15 } }
```

## Gemini Context for Follow-ups

```typescript
const followUpPrompt = `
You previously analyzed a TikTok video and provided this feedback:

${initialAnalysis}

The user has a follow-up question:
"${userQuestion}"

Provide a helpful response based on your previous analysis.
`;
```

## Data Value Over Time

As audits accumulate:
- Identify common issues (e.g., "80% of videos lack strong CTAs")
- Find patterns in successful vs unsuccessful videos
- Build FAQ from most common follow-up questions
- Potentially fine-tune or improve prompts based on feedback
