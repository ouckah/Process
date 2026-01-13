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
            backgroundColor: '#fefcf8',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            position: 'relative',
            padding: '40px',
          }}
        >
          {/* Main wrapper */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1000px', alignItems: 'center' }}>
            {/* Title wrapper - matching email title-wrapper */}
            <div style={{ position: 'relative', display: 'flex', marginBottom: '32px' }}>
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
                    fontSize: '64px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    margin: 0,
                    textAlign: 'center',
                    display: 'flex',
                  }}
                >
                  FORUM
                </div>
              </div>
            </div>
            
            {/* Description wrapper - matching email description-wrapper */}
            <div style={{ position: 'relative', display: 'flex', marginBottom: '48px' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#f5f5f0',
                  transform: 'translate(4px, 4px)',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#f5f5f0',
                  border: '2px solid #1c1917',
                  padding: '24px',
                  paddingTop: '36px',
                  transform: 'rotate(-1deg)',
                  maxWidth: '800px',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#57534e',
                    textAlign: 'center',
                    margin: 0,
                    display: 'flex',
                  }}
                >
                  DISCUSS JOB APPLICATION PROCESSES, SHARE EXPERIENCES, AND GET ADVICE FROM THE COMMUNITY
                </div>
              </div>
            </div>
            
            {/* Decorative buttons - matching email button-wrapper structure */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* DISCUSS */}
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
                    padding: '16px 32px',
                    textDecoration: 'none',
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
                  DISCUSS
                </div>
              </div>
              
              {/* SHARE */}
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
                    padding: '16px 32px',
                    textDecoration: 'none',
                    border: '4px solid #1c1917',
                    transform: 'rotate(1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '18px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  SHARE
                </div>
              </div>
              
              {/* LEARN */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#10b981',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    padding: '16px 32px',
                    textDecoration: 'none',
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
                  LEARN
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
            fontFamily: 'DM Sans, system-ui, sans-serif',
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
