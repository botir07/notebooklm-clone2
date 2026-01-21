
export interface Source {
  id: string;
  name: string;
  content: string;
  type: 'file' | 'link' | 'text' | 'youtube';
  fileType?: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  sourcesUsed?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface FlashcardData {
  title: string;
  cards: Flashcard[];
}

export interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  title: string;
  rootNode: MindMapNode;
}

export interface Slide {
  title: string;
  content: string[];
  code?: string;
  imageUrl?: string;
}

export interface PresentationData {
  title: string;
  slides: Slide[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  type?: StudyMaterialType;
  sourceCount?: number;
  quizData?: QuizData;
  flashcardData?: FlashcardData;
  mindMapData?: MindMapData;
  presentationData?: PresentationData;
  infographicImageUrl?: string;
}

export type StudyMaterialType = 'infographic' | 'mindmap' | 'quiz' | 'presentation' | 'reminders' | 'flashcard';

export interface StudyMaterial {
  type: StudyMaterialType;
  title: string;
  content: string;
}

export interface AITask {
  id: string;
  type: StudyMaterialType;
  title: string;
  content: string | null;
  status: 'generating' | 'completed';
}
