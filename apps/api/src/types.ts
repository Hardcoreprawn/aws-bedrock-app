export interface UploadRequest {
  files: Array<{
    fileName: string;
    contentType: string;
  }>;
}

export interface ReviewRequest {
  documentKeys: string[];
}

export interface AgentResult {
  agent: string;
  summary: string;
  details: string;
}

export interface ReviewRecord {
  reviewId: string;
  status: 'SUBMITTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  findings: AgentResult[];
  finalSummary?: string;
  submittedBy?: string;
  submittedByName?: string;
  createdAt?: string;
}

export interface AuthenticatedIdentity {
  subject: string;
  name?: string;
  roles: string[];
}

