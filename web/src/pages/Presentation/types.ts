/**
 * Presentation slide type definitions
 */

export interface TitleContent {
  title: string;
  subtitle: string;
  author: string;
  meta: string;
}

export interface BasicsContent {
  section: string;
  name: string;
  role: string;
  stack: string;
  project: string;
}

export interface ChecklistItem {
  label: string;
  checked: boolean;
  note?: string;
}

export interface ChecklistContent {
  section: string;
  title: string;
  items: ChecklistItem[];
}

export interface HighlightContent {
  section: string;
  title: string;
  value: string;
  subtitle: string;
  details: string[];
}

export interface UsecaseContent {
  section: string;
  number: number;
  title: string;
  task: string;
  tool: string;
  asked: string;
  shipped: string;
  fixed: string;
  verified: string;
  impact: string;
}

export interface ComparisonContent {
  section: string;
  title: string;
  items: string[];
  sentiment: 'slow' | 'fast';
}

export interface TwoColumnContent {
  section: string;
  title: string;
  left: { label: string; text: string };
  right: { label: string; text: string };
}

export interface ShowcaseStat {
  label: string;
  value: string;
}

export interface ShowcaseContent {
  section: string;
  title: string;
  description: string;
  stats: ShowcaseStat[];
  aiHelped: string[];
  lesson: string;
}

export interface StoryContent {
  section: string;
  type: 'success' | 'warning';
  title: string;
  story: string;
  why?: string;
  lesson?: string;
  diagram?: string;
  diagramCaption?: string;
}

export interface RecommendationItem {
  tip: string;
  detail: string;
}

export interface RecommendationContent {
  section: string;
  title: string;
  items: RecommendationItem[];
}

export interface BulletItem {
  label: string;
  text: string;
}

export interface BulletsContent {
  section: string;
  title: string;
  bullets: BulletItem[];
}

export interface CTALink {
  label: string;
  url: string;
  internal?: boolean;
}

export interface CTAContent {
  title: string;
  subtitle: string;
  links: CTALink[];
}

export type Slide =
  | { id: string; type: 'title'; content: TitleContent }
  | { id: string; type: 'basics'; content: BasicsContent }
  | { id: string; type: 'checklist'; content: ChecklistContent }
  | { id: string; type: 'highlight'; content: HighlightContent }
  | { id: string; type: 'usecase'; content: UsecaseContent }
  | { id: string; type: 'comparison'; content: ComparisonContent }
  | { id: string; type: 'twoColumn'; content: TwoColumnContent }
  | { id: string; type: 'showcase'; content: ShowcaseContent }
  | { id: string; type: 'story'; content: StoryContent }
  | { id: string; type: 'recommendation'; content: RecommendationContent }
  | { id: string; type: 'bullets'; content: BulletsContent }
  | { id: string; type: 'cta'; content: CTAContent };
