import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#1A1A1A',
                marginBottom: 32,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                textAlign: 'center',
                display: 'flex',
              }}
            >
              FORUM
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: 32,
                color: '#1A1A1A',
                textAlign: 'center',
                fontWeight: 500,
                maxWidth: '80%',
                display: 'flex',
              }}
            >
              Discuss job application processes, share experiences, and get advice from the community
            </div>
            
            {/* Decorative elements */}
            <div
              style={{
                display: 'flex',
                gap: 24,
                marginTop: 48,
              }}
            >
              <div
                style={{
                  backgroundColor: '#6366F1',
                  color: '#FAF9F6',
                  padding: '16px 32px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(1deg)',
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                }}
              >
                DISCUSS
              </div>
              <div
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#1A1A1A',
                  padding: '16px 32px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(-1deg)',
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                }}
              >
                SHARE
              </div>
              <div
                style={{
                  backgroundColor: '#10B981',
                  color: '#FAF9F6',
                  padding: '16px 32px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(1deg)',
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                }}
              >
                LEARN
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
          Forum
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
