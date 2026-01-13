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
            backgroundColor: '#fefcf8',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            position: 'relative',
            padding: '40px',
          }}
        >
          {/* Main wrapper - matching email structure */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1000px', gap: '24px' }}>
            {/* Title - matching email title-wrapper */}
            <div style={{ position: 'relative', display: 'flex' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#1c1917',
                  transform: 'translate(8px, 8px)',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#1c1917',
                  color: '#fefcf8',
                  padding: '16px 24px',
                  border: '4px solid #1c1917',
                  transform: 'rotate(1deg)',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '48px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    margin: 0,
                    display: 'flex',
                  }}
                >
                  {title}
                </div>
              </div>
            </div>
            
            {/* Author info - matching email button-wrapper */}
            <div style={{ position: 'relative', display: 'flex' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#1c1917',
                  transform: 'translate(8px, 8px)',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#1c1917',
                  color: '#fefcf8',
                  padding: '12px 24px',
                  border: '4px solid #1c1917',
                  transform: 'rotate(-1deg)',
                  fontFamily: 'DM Sans, system-ui, sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  display: 'flex',
                }}
              >
                {authorName}
              </div>
            </div>
            
            {/* Content preview - matching email notification-wrapper */}
            {truncatedContent ? (
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#1c1917',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#fefcf8',
                    border: '4px solid #1c1917',
                    padding: '24px',
                    transform: 'rotate(-1deg)',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'DM Sans, system-ui, sans-serif',
                      fontSize: '20px',
                      lineHeight: 1.6,
                      color: '#1c1917',
                      margin: 0,
                      display: 'flex',
                    }}
                  >
                    {truncatedContent}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'none' }} />
            )}
            
            {/* Stats - matching email button-wrapper */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Reply Count */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#4f46e5',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    padding: '12px 24px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  {replyCount} {replyCount === 1 ? 'REPLY' : 'REPLIES'}
                </div>
              </div>
              
              {/* View Count */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#f59e0b',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#f59e0b',
                    color: '#1c1917',
                    padding: '12px 24px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(-1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  {viewCount} VIEWS
                </div>
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
            backgroundColor: '#fefcf8',
            fontSize: 32,
            fontWeight: 700,
            color: '#1c1917',
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
