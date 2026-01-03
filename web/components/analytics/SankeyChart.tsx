'use client';

import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import type { Process, ProcessDetail } from '@/types';

interface SankeyChartProps {
  processes: Process[];
  processDetails?: ProcessDetail[];
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
  const { x, y, width, height, index, payload, containerWidth } = props;
  const isOut = x + width + 6 > containerWidth;
  const nodeName = payload.name;
  const nodeCount = payload.count || 0;

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
        x={x + width + 16}
        y={y + height / 2 - 12}
        textAnchor="start"
        fill="currentColor"
        className="text-gray-900 dark:text-gray-100"
        fontSize="16"
        fontWeight="600"
        dominantBaseline="middle"
      >
        {nodeCount}
      </text>
      <text
        x={x + width + 16}
        y={y + height / 2 + 12}
        textAnchor="start"
        fill="currentColor"
        className="text-gray-900 dark:text-gray-100"
        fontSize="18"
        fontWeight="400"
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

export function SankeyChart({ processes, processDetails = [] }: SankeyChartProps) {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Stage Flow (Sankey Diagram)</h3>
      <div className="w-full h-[500px] bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            node={<CustomNode />}
            nodePadding={50}
            margin={{ top: 20, right: 300, bottom: 20, left: 300 }}
            link={<CustomLink />}
            nodeWidth={20}
          >
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Shows the flow of processes through different stages. Wider flows indicate more transitions.
      </p>
    </div>
  );
}
