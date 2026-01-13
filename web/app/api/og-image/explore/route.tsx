import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch explore stats
    let stats: any = null;
    try {
      const response = await fetch(`${apiUrl}/api/explore/stats`, {
        cache: 'no-store',
      });
      if (response.ok) {
        stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    
    const totalProcesses = stats?.total_processes || 0;
    const totalCompanies = stats?.total_companies || 0;
    const totalStages = stats?.total_stages || 0;
    
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
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1000px' }}>
            {/* Title wrapper - matching email title-wrapper */}
            <div style={{ position: 'relative', display: 'flex', marginBottom: '32px', alignSelf: 'center' }}>
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
                    textAlign: 'center',
                    display: 'flex',
                  }}
                >
                  EXPLORE PROCESSES
                </div>
              </div>
            </div>
            
            {/* Description wrapper - matching email description-wrapper */}
            <div style={{ position: 'relative', display: 'flex', marginBottom: '48px', alignSelf: 'center' }}>
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
                  DISCOVER JOB APPLICATION PROCESSES SHARED BY THE COMMUNITY
                </div>
              </div>
            </div>
            
            {/* Stats - using same structure as email boxes */}
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Process Stat - matching email button-wrapper structure */}
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
                    padding: '20px 32px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(-1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '20px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '8px', display: 'flex', fontWeight: 900 }}>{totalProcesses}</div>
                  <div style={{ display: 'flex' }}>PROCESSES</div>
                </div>
              </div>
              
              {/* Company Stat */}
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
                    padding: '20px 32px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '20px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '8px', display: 'flex', fontWeight: 900 }}>{totalCompanies}</div>
                  <div style={{ display: 'flex' }}>COMPANIES</div>
                </div>
              </div>
              
              {/* Stage Stat */}
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
                    padding: '20px 32px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(-1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '20px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '8px', display: 'flex', fontWeight: 900 }}>{totalStages}</div>
                  <div style={{ display: 'flex' }}>STAGES</div>
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
          Explore Processes
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
