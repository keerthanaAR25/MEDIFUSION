export interface User {
  id: number;
  username: string;
  email: string;
  role: 'doctor' | 'patient' | 'admin';
  full_name: string;
}

export interface Patient {
  id: number;
  case_id: string;
  name: string;
  age: number;
  gender: string;
  ward: string;
  diagnosis: string;
  attending: string;
  status: 'Processing' | 'Completed' | 'Under Review' | 'Pending';
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  case_id: string;
  transcription: string;
  imaging_report: string;
  lab_values: Record<string, string>;
  keywords: string[];
  confidence_score: number;
  rag_sources: Array<{ title: string; cosine: number }>;
  diagnosis: string;
  reasoning: string;
  timeline: TimelineEvent[];
  summary_sections: SummarySections;
  patient_instructions: PatientInstructions;
}

export interface TimelineEvent {
  time: string;
  event: string;
  source: string;
  icon: string;
}

export interface SummarySections {
  diagnosis: string;
  hospital_course: string;
  investigations: string;
  treatment: string;
  medications: string;
  followup: string;
}

export interface PatientInstructions {
  diagnosis: string;
  medications: string[];
  followup: string;
  warnings: string[];
  diet: string;
  activity: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}