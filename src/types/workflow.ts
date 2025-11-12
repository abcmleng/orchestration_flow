export interface NodeData {
  id: string;
  type: 'start' | 'end' | 'liveness' | 'cardCapture' | 'scanner';
  label: string;
  apiEndpoint: string;
  requestPayload: any;
  response?: any;
  status: 'idle' | 'running' | 'success' | 'failed';
  error?: string;
  executionTime?: number;
  timestamp?: string;
  outputSchema?: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface WorkflowState {
  nodes: any[];
  edges: WorkflowEdge[];
  selectedNode: string | null;
  isExecuting: boolean;
  executionOrder: string[];
}

export interface APIResponse {
  success: boolean;
  data: any;
  timestamp: string;
  processingTime: number;
  nodeId?: string;
  sessionId?: string;
}