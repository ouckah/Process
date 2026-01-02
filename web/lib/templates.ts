import type { ProcessCreate, StageCreate } from '@/types';

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  process: Omit<ProcessCreate, 'status'>;
  stages: Omit<StageCreate, 'process_id' | 'order'>[];
}

export const DEFAULT_TEMPLATES: ProcessTemplate[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer',
    description: 'Standard software engineering interview process',
    process: {
      company_name: '',
      position: 'Software Engineer',
    },
    stages: [
      { stage_name: 'OA', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Phone Screen', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Technical Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'System Design', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'HM Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Final Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
    ],
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    description: 'Data science interview process',
    process: {
      company_name: '',
      position: 'Data Scientist',
    },
    stages: [
      { stage_name: 'OA', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Phone Screen', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Technical Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Take-home Assignment', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'HM Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
    ],
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    description: 'Product management interview process',
    process: {
      company_name: '',
      position: 'Product Manager',
    },
    stages: [
      { stage_name: 'Phone Screen', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Behavioral Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Case Study', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'HM Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
      { stage_name: 'Final Interview', stage_date: new Date().toISOString().split('T')[0], notes: null },
    ],
  },
];

// Load custom templates from localStorage
export function getCustomTemplates(): ProcessTemplate[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('process_templates');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save custom template to localStorage
export function saveCustomTemplate(template: ProcessTemplate): void {
  if (typeof window === 'undefined') return;
  const custom = getCustomTemplates();
  custom.push(template);
  localStorage.setItem('process_templates', JSON.stringify(custom));
}

// Get all templates (default + custom)
export function getAllTemplates(): ProcessTemplate[] {
  return [...DEFAULT_TEMPLATES, ...getCustomTemplates()];
}


