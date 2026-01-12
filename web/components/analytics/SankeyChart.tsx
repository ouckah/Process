'use client';

import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import type { Process, ProcessDetail } from '@/types';

interface SankeyChartProps {
  processes: Process[];
  processDetails?: ProcessDetail[];
  largeText?: boolean; // For OG images/thumbnails - makes text larger for readability
}

interface SankeyNode {
  name: string;
  count?: number;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const COLORS: Record<string, string> = {
  'Applied': '#FDE68A', // pastel yellow
  'OA': '#3B82F6', // blue
  'Phone Screen': '#60A5FA', // light blue
  'Technical Interview': '#818CF8', // indigo
  'HM Interview': '#A78BFA', // purple
  'Final Interview': '#C084FC', // light purple
  'On-site Interview': '#E879F9', // pink
  'Take-home Assignment': '#F472B6', // rose
  'System Design': '#FB7185', // rose
  'Behavioral Interview': '#F87171', // red
  'Coding Challenge': '#EF4444', // red
  'Offer': '#10B981', // green
  'Reject': '#EF4444', // red
  'Other': '#6B7280', // gray
};

const nodeColors: Record<string, string> = COLORS;

function transformProcessesToSankey(
  processes: Process[],
  processDetails: ProcessDetail[]
): SankeyData {
  // Create a map for quick lookup
  const processDetailsMap = new Map<number, ProcessDetail>();
  processDetails.forEach(pd => processDetailsMap.set(pd.id, pd));

  // Track all unique stage names, transitions, and stage counts
  const nodeSet = new Set<string>();
  const nodeCountMap = new Map<string, number>(); // stage name -> total count
  const linkMap = new Map<string, number>(); // "source->target" -> count

  // Analyze each process to get actual stage transitions
  processes.forEach((process) => {
    const detail = processDetailsMap.get(process.id);
    const stages = detail?.stages || [];
    
    if (stages.length === 0) return;

    // Sort stages by date to get chronological order
    const sortedStages = [...stages].sort((a, b) => 
      new Date(a.stage_date).getTime() - new Date(b.stage_date).getTime()
    );

    // Add all stage names to node set and count occurrences
    sortedStages.forEach(stage => {
      nodeSet.add(stage.stage_name);
      nodeCountMap.set(stage.stage_name, (nodeCountMap.get(stage.stage_name) || 0) + 1);
    });

    // Count transitions between consecutive stages
    for (let i = 0; i < sortedStages.length - 1; i++) {
      const source = sortedStages[i].stage_name;
      const target = sortedStages[i + 1].stage_name;
      const key = `${source}->${target}`;
      linkMap.set(key, (linkMap.get(key) || 0) + 1);
    }
  });

  // Order nodes by typical flow
  const stageOrder = [
    'Applied',
    'OA',
    'Phone Screen',
    'Technical Interview',
    'HM Interview',
    'Final Interview',
    'On-site Interview',
    'Take-home Assignment',
    'System Design',
    'Behavioral Interview',
    'Coding Challenge',
    'Offer',
    'Reject',
    'Other',
  ];

  // Create nodes array - ordered by typical flow, then any others
  const orderedNodes = stageOrder.filter(stage => nodeSet.has(stage));
  const otherNodes = Array.from(nodeSet).filter(stage => !stageOrder.includes(stage));
  const nodes: SankeyNode[] = [...orderedNodes, ...otherNodes].map(name => ({ 
    name,
    count: nodeCountMap.get(name) || 0,
  }));

  // Create node index map
  const nodeIndexMap = new Map<string, number>();
  nodes.forEach((node, index) => {
    nodeIndexMap.set(node.name, index);
  });

  // Create links array from actual transitions
  const links: SankeyLink[] = Array.from(linkMap.entries())
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
    .filter((link): link is SankeyLink => link !== null);

  return { nodes, links };
}

const CustomNode = (props: any) => {
  const { x, y, width, height, index, payload, containerWidth, largeText } = props;
  const isOut = x + width + 6 > containerWidth;
  const nodeName = payload.name;
  const nodeCount = payload.count || 0;

  // Use larger text sizes for thumbnails/OG images
  const countFontSize = largeText ? "28" : "16";
  const countFontWeight = largeText ? "700" : "600";
  const nameFontSize = largeText ? "24" : "18";
  const nameFontWeight = largeText ? "600" : "400";
  const textOffsetX = largeText ? 20 : 16;
  const textOffsetY = largeText ? 16 : 12;

  return (
    <g>
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={height} 
        fill={nodeColors[nodeName] || '#8884d8'} 
        fillOpacity="1" 
      />
      <text
        x={x + width + textOffsetX}
        y={y + height / 2 - textOffsetY}
        textAnchor="start"
        fill="currentColor"
        className="text-gray-900 dark:text-gray-100"
        fontSize={countFontSize}
        fontWeight={countFontWeight}
        dominantBaseline="middle"
      >
        {nodeCount}
      </text>
      <text
        x={x + width + textOffsetX}
        y={y + height / 2 + textOffsetY}
        textAnchor="start"
        fill="currentColor"
        className="text-gray-900 dark:text-gray-100"
        fontSize={nameFontSize}
        fontWeight={nameFontWeight}
        dominantBaseline="middle"
      >
        {nodeName}
      </text>
    </g>
  );
};

const CustomLink = (props: any) => {
  const { sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, index, payload } = props;
  const sourceNode = payload.source.name;
  const targetNode = payload.target.name;

  // Determine color based on source node
  const linkColor = nodeColors[sourceNode] || '#77777777';

  return (
    <g>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={linkColor}
        strokeWidth={linkWidth}
        strokeOpacity="0.4"
      />
    </g>
  );
};

export function SankeyChart({ processes, processDetails = [], largeText = false }: SankeyChartProps) {
  const sankeyData = useMemo(() => {
    if (!processes || processes.length === 0) {
      return {
        nodes: [],
        links: [],
      };
    }

    return transformProcessesToSankey(processes, processDetails);
  }, [processes, processDetails]);

  if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
        <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 flex items-center justify-center h-64 transform rotate-1">
          <p className="font-body text-ink-700 dark:text-ink-300 font-bold uppercase tracking-wider">No data to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group w-full">
      <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
      <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1 group-hover:rotate-0 transition-transform">
        <div className="mb-6">
          <div className="inline-block bg-purple-600 dark:bg-purple-500 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mb-3">
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">Stage Flow</h3>
          </div>
        </div>
        <div className="w-full h-[500px] bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-8">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={sankeyData}
              node={<CustomNode largeText={largeText} />}
              nodePadding={50}
              margin={{ top: 20, right: largeText ? 500 : 400, bottom: 20, left: largeText ? 500 : 400 }}
              link={<CustomLink />}
              nodeWidth={largeText ? 28 : 24}
            >
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgb(var(--color-cream-50))',
                  border: '4px solid rgb(var(--color-ink-900))',
                  borderRadius: '0',
                  fontWeight: 'bold',
                }}
              />
            </Sankey>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 bg-ink-900 dark:bg-cream-50 px-4 py-2 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
          <p className="font-body text-xs font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
            Wider flows = more transitions
          </p>
        </div>
      </div>
    </div>
  );
}
