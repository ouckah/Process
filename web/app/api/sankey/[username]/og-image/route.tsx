import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const COLORS: Record<string, string> = {
  'Applied': '#FDE68A',
  'OA': '#3B82F6',
  'Phone Screen': '#60A5FA',
  'Technical Interview': '#818CF8',
  'HM Interview': '#A78BFA',
  'Final Interview': '#C084FC',
  'On-site Interview': '#E879F9',
  'Take-home Assignment': '#F472B6',
  'System Design': '#FB7185',
  'Behavioral Interview': '#F87171',
  'Coding Challenge': '#EF4444',
  'Offer': '#10B981',
  'Reject': '#EF4444',
  'Other': '#6B7280',
};

function transformProcessesToSankey(processes: any[], processDetails: any[]) {
  const processDetailsMap = new Map();
  processDetails.forEach(pd => processDetailsMap.set(pd.id, pd));

  const nodeSet = new Set<string>();
  const nodeCountMap = new Map<string, number>();
  const linkMap = new Map<string, number>();

  processes.forEach((process) => {
    const detail = processDetailsMap.get(process.id);
    const stages = detail?.stages || [];
    
    if (stages.length === 0) return;

    const sortedStages = [...stages].sort((a, b) => 
      new Date(a.stage_date).getTime() - new Date(b.stage_date).getTime()
    );

    sortedStages.forEach(stage => {
      nodeSet.add(stage.stage_name);
      nodeCountMap.set(stage.stage_name, (nodeCountMap.get(stage.stage_name) || 0) + 1);
    });

    for (let i = 0; i < sortedStages.length - 1; i++) {
      const source = sortedStages[i].stage_name;
      const target = sortedStages[i + 1].stage_name;
      const key = `${source}->${target}`;
      linkMap.set(key, (linkMap.get(key) || 0) + 1);
    }
  });

  const stageOrder = [
    'Applied', 'OA', 'Phone Screen', 'Technical Interview', 'HM Interview',
    'Final Interview', 'On-site Interview', 'Take-home Assignment',
    'System Design', 'Behavioral Interview', 'Coding Challenge',
    'Offer', 'Reject', 'Other',
  ];

  const orderedNodes = stageOrder.filter(stage => nodeSet.has(stage));
  const otherNodes = Array.from(nodeSet).filter(stage => !stageOrder.includes(stage));
  const nodes = [...orderedNodes, ...otherNodes].map(name => ({ 
    name,
    count: nodeCountMap.get(name) || 0,
  }));

  const nodeIndexMap = new Map<string, number>();
  nodes.forEach((node, index) => {
    nodeIndexMap.set(node.name, index);
  });

  const links = Array.from(linkMap.entries())
    .map(([key, value]) => {
      const [source, target] = key.split('->');
      const sourceIndex = nodeIndexMap.get(source);
      const targetIndex = nodeIndexMap.get(target);
      
      if (sourceIndex === undefined || targetIndex === undefined) {
        return null;
      }
      
      return {
        source: sourceIndex,
        target: targetIndex,
        value,
      };
    })
    .filter((link): link is { source: number; target: number; value: number } => link !== null);

  return { nodes, links };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = decodeURIComponent(params.username);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch analytics data
    const response = await fetch(
      `${apiUrl}/api/analytics/${encodeURIComponent(username)}/public`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      return new Response('Not Found', { status: 404 });
    }
    
    const analytics = await response.json();
    const displayName = analytics.is_anonymous
      ? (analytics.display_name || 'Anonymous User')
      : analytics.username;

    // Transform to Sankey data
    const sankeyData = transformProcessesToSankey(
      analytics.processes || [],
      analytics.process_details || []
    );

    if (!sankeyData.nodes || sankeyData.nodes.length === 0) {
      // Fallback to text if no data
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
              backgroundColor: '#F9FAFB',
            }}
          >
            <div style={{ fontSize: 60, fontWeight: 700, marginBottom: 20 }}>
              📊 Sankey Diagram
            </div>
            <div style={{ fontSize: 40, color: '#6B7280' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 30, color: '#9CA3AF', marginTop: 20 }}>
              No data available
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    // Calculate layout for Sankey diagram
    const nodeCount = sankeyData.nodes.length;
    const nodeHeight = 25;
    const nodeWidth = 12;
    const nodePadding = 35;
    const leftMargin = 80;
    const chartAreaHeight = 400;
    const chartAreaTop = 150;
    
    // Calculate node positions (vertical layout)
    const totalNodeHeight = nodeCount * (nodeHeight + nodePadding);
    const startY = chartAreaTop + (chartAreaHeight - totalNodeHeight) / 2;

    const nodePositions = sankeyData.nodes.map((node, i) => {
      const y = startY + i * (nodeHeight + nodePadding);
      return {
        ...node,
        x: leftMargin,
        y,
        width: nodeWidth,
        height: nodeHeight,
        color: COLORS[node.name] || '#8884d8',
      };
    });

    // Create Open Graph image with Sankey diagram
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 30,
              paddingBottom: 20,
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 700, color: '#111827' }}>
              📊 Sankey Diagram
            </div>
            <div style={{ fontSize: 28, color: '#6B7280', marginTop: 8 }}>
              {displayName}
            </div>
          </div>

          {/* Sankey Diagram Container */}
          <div
            style={{
              position: 'absolute',
              top: chartAreaTop,
              left: 0,
              width: '100%',
              height: chartAreaHeight,
            }}
          >
            {/* Draw nodes */}
            {nodePositions.map((node, i) => (
              <div
                key={`node-${i}`}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height,
                  backgroundColor: node.color,
                  borderRadius: '3px',
                }}
              />
            ))}

            {/* Draw labels */}
            {nodePositions.map((node, i) => (
              <div
                key={`label-${i}`}
                style={{
                  position: 'absolute',
                  left: node.x + node.width + 12,
                  top: node.y - 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#111827',
                    lineHeight: 1.2,
                  }}
                >
                  {node.count}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: '#111827',
                    lineHeight: 1.2,
                    marginTop: 2,
                  }}
                >
                  {node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name}
                </div>
              </div>
            ))}

            {/* Draw links as simple lines (simplified for OG image) */}
            {sankeyData.links.slice(0, 15).map((link, i) => {
              const sourceNode = nodePositions[link.source];
              const targetNode = nodePositions[link.target];
              
              if (!sourceNode || !targetNode) return null;

              const sourceX = sourceNode.x + sourceNode.width;
              const sourceY = sourceNode.y + sourceNode.height / 2;
              const targetX = sourceX + 250;
              const targetY = targetNode.y + targetNode.height / 2;
              const linkWidth = Math.max(1, Math.min(link.value * 2, 8));

              // Draw link as a simple div (curved effect approximated)
              return (
                <div
                  key={`link-${i}`}
                  style={{
                    position: 'absolute',
                    left: sourceX,
                    top: Math.min(sourceY, targetY),
                    width: targetX - sourceX,
                    height: linkWidth,
                    backgroundColor: sourceNode.color,
                    opacity: 0.4,
                    transform: `rotate(${Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI}deg)`,
                    transformOrigin: 'left center',
                  }}
                />
              );
            })}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Error generating OG image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
