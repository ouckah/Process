// Predefined stage types for job application processes
export interface StageType {
  value: string;
  label: string;
  abbreviation?: string;
}

export const STAGE_TYPES: StageType[] = [
  { value: 'Applied', label: 'Applied' },
  { value: 'OA', label: 'OA (Online Assessment)', abbreviation: 'OA' },
  { value: 'Phone Screen', label: 'Phone Screen' },
  { value: 'Technical Interview', label: 'Technical Interview' },
  { value: 'HM Interview', label: 'HM (Hiring Manager) Interview', abbreviation: 'HM' },
  { value: 'Final Interview', label: 'Final Interview' },
  { value: 'On-site Interview', label: 'On-site Interview' },
  { value: 'Take-home Assignment', label: 'Take-home Assignment' },
  { value: 'System Design', label: 'System Design Interview' },
  { value: 'Behavioral Interview', label: 'Behavioral Interview' },
  { value: 'Coding Challenge', label: 'Coding Challenge' },
  { value: 'Reject', label: 'Reject' },
  { value: 'Offer', label: 'Offer' },
  { value: 'Other', label: 'Other (Custom)' },
];

// Helper function to get display name for a stage
export function getStageDisplayName(stageName: string): string {
  const stageType = STAGE_TYPES.find(st => st.value === stageName);
  if (stageType) {
    return stageType.label;
  }
  // If not found in predefined types, return as-is (for custom stages)
  return stageName;
}

