import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } | Promise<{ threadId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const threadId = resolvedParams.threadId;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch thread data
    let thread: any = null;
    try {
      const response = await fetch(`${apiUrl}/api/forum/threads/${threadId}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        thread = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch thread:', error);
    }
    
    // Strip markdown and truncate content
    const stripMarkdown = (text: string): string => {
      return text
        .replace(/#{1,6}\s+/g, '') // Headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
        .replace(/`([^`]+)`/g, '$1') // Code
        .replace(/\n+/g, ' ') // Newlines
        .trim();
    };
    
    const title = thread?.title || 'Forum Thread';
    const content = thread?.content ? stripMarkdown(thread.content) : '';
    const truncatedContent = content.length > 250 ? content.substring(0, 250) + '...' : content;
    const authorName = thread?.author_username || thread?.author_display_name || 'Anonymous';
    const replyCount = thread?.reply_count || 0;
    const viewCount = thread?.view_count || 0;
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF9F6',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Background layer - shadow */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: '100%',
              height: '100%',
              backgroundColor: '#1A1A1A',
            }}
          />
          
          {/* Main content box */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              width: '90%',
              height: '85%',
              backgroundColor: '#FAF9F6',
              border: '16px solid #1A1A1A',
              padding: '48px',
              transform: 'rotate(1deg)',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#1A1A1A',
                marginBottom: 24,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                display: 'flex',
              }}
            >
              {title}
            </div>
            
            {/* Author info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  backgroundColor: '#1A1A1A',
                  color: '#FAF9F6',
                  padding: '12px 24px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(-1deg)',
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                }}
              >
                {authorName}
              </div>
            </div>
            
            {/* Content preview */}
            {truncatedContent ? (
              <div
                style={{
                  fontSize: 24,
                  color: '#1A1A1A',
                  lineHeight: 1.5,
                  marginBottom: 32,
                  flex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {truncatedContent}
              </div>
            ) : (
              <div style={{ display: 'none' }} />
            )}
            
            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: 24,
                marginTop: 'auto',
              }}
            >
              <div
                style={{
                  backgroundColor: '#6366F1',
                  color: '#FAF9F6',
                  padding: '12px 24px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(1deg)',
                  fontSize: 18,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'flex',
                }}
              >
                {replyCount} {replyCount === 1 ? 'REPLY' : 'REPLIES'}
              </div>
              <div
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#1A1A1A',
                  padding: '12px 24px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(-1deg)',
                  fontSize: 18,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'flex',
                }}
              >
                {viewCount} VIEWS
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('OG image generation error:', error);
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF9F6',
            fontSize: 32,
            fontWeight: 700,
            color: '#1A1A1A',
          }}
        >
          Forum Thread
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
