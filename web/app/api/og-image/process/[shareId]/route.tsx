import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } | Promise<{ shareId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const shareId = resolvedParams.shareId;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch process data
    let processData: any = null;
    try {
      const response = await fetch(`${apiUrl}/api/processes/share/${shareId}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        processData = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch process:', error);
    }
    
    const companyName = processData?.company_name || 'Process';
    const position = processData?.position || null;
    const username = processData?.username || null;
    const status = processData?.status || 'active';
    const stages = processData?.stages || [];
    const stageCount = stages.length;
    
    // Status colors
    const statusColors: Record<string, { bg: string; text: string }> = {
      active: { bg: '#3B82F6', text: '#FAF9F6' },
      completed: { bg: '#10B981', text: '#FAF9F6' },
      rejected: { bg: '#EF4444', text: '#FAF9F6' },
    };
    const statusColor = statusColors[status] || statusColors.active;
    
    // Get first few stage names
    const stageNames = stages.slice(0, 3).map((s: any) => s.stage_name);
    
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
              top: 12,
              left: 12,
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
              transform: 'rotate(1.5deg)',
            }}
          >
            {/* Company Name */}
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#1A1A1A',
                marginBottom: 16,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                display: 'flex',
              }}
            >
              {companyName}
            </div>
            
            {/* Position */}
            {position ? (
              <div style={{ position: 'relative', display: 'inline-block', width: 'fit-content', marginBottom: 32 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#1A1A1A',
                    transform: 'translate(12px, 12px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#1A1A1A',
                    color: '#FAF9F6',
                    padding: '12px 24px',
                    border: '8px solid #1A1A1A',
                    transform: 'rotate(-1.5deg)',
                    fontSize: 28,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'flex',
                  }}
                >
                  {position}
                </div>
              </div>
            ) : (
              <div style={{ display: 'none' }} />
            )}
            
            {/* Status and Author */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: 32,
                flexWrap: 'wrap',
              }}
            >
              {/* Status Badge */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#1A1A1A',
                    transform: 'translate(12px, 12px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: statusColor.bg,
                    color: statusColor.text,
                    padding: '12px 24px',
                    border: '8px solid #1A1A1A',
                    transform: 'rotate(1.5deg)',
                    fontSize: 20,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'flex',
                  }}
                >
                  {status.toUpperCase()}
                </div>
              </div>
              
              {/* Username Badge */}
              {username ? (
                <div style={{ position: 'relative', display: 'flex' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: '#1A1A1A',
                      transform: 'translate(12px, 12px)',
                      display: 'flex',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      backgroundColor: '#6366F1',
                      color: '#FAF9F6',
                      padding: '12px 24px',
                      border: '8px solid #1A1A1A',
                      transform: 'rotate(-1.5deg)',
                      fontSize: 20,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      display: 'flex',
                    }}
                  >
                    @{username}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'none' }} />
              )}
            </div>
            
            {/* Stages */}
            {stageCount > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  marginTop: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#1A1A1A',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    letterSpacing: '0.08em',
                    display: 'flex',
                  }}
                >
                  {stageCount} {stageCount === 1 ? 'STAGE' : 'STAGES'}
                </div>
                {stageNames.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {stageNames.map((name: string, idx: number) => (
                      <div key={idx} style={{ position: 'relative', display: 'flex' }}>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: '#1A1A1A',
                            transform: 'translate(12px, 12px)',
                            display: 'flex',
                          }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            backgroundColor: '#F59E0B',
                            color: '#1A1A1A',
                            padding: '10px 20px',
                            border: '8px solid #1A1A1A',
                            transform: idx % 2 === 0 ? 'rotate(1.5deg)' : 'rotate(-1.5deg)',
                            fontSize: 18,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            display: 'flex',
                          }}
                        >
                          {name}
                        </div>
                      </div>
                    ))}
                    {stageCount > 3 ? (
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: '#1A1A1A',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          display: 'flex',
                        }}
                      >
                        +{stageCount - 3} MORE
                      </div>
                    ) : (
                      <div style={{ display: 'none' }} />
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'none' }} />
                )}
              </div>
            ) : (
              <div style={{ display: 'none' }} />
            )}
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
          Process
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
