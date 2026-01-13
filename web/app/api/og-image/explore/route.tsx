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
              display: 'flex',
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
                fontSize: 72,
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#1A1A1A',
                marginBottom: 48,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                textAlign: 'center',
                display: 'flex',
              }}
            >
              EXPLORE PROCESSES
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: 28,
                color: '#1A1A1A',
                marginBottom: 48,
                textAlign: 'center',
                fontWeight: 500,
                display: 'flex',
              }}
            >
              Discover job application processes shared by the community
            </div>
            
            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: 32,
                marginTop: 32,
              }}
            >
              <div
                style={{
                  backgroundColor: '#6366F1',
                  color: '#FAF9F6',
                  padding: '20px 32px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(1deg)',
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8, display: 'flex' }}>{totalProcesses}</div>
                <div style={{ display: 'flex' }}>PROCESSES</div>
              </div>
              <div
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#1A1A1A',
                  padding: '20px 32px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(-1deg)',
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8, display: 'flex' }}>{totalCompanies}</div>
                <div style={{ display: 'flex' }}>COMPANIES</div>
              </div>
              <div
                style={{
                  backgroundColor: '#10B981',
                  color: '#FAF9F6',
                  padding: '20px 32px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(1deg)',
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8, display: 'flex' }}>{totalStages}</div>
                <div style={{ display: 'flex' }}>STAGES</div>
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
