import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge } from 'reactflow';
import { NodeData, WorkflowState, APIResponse } from '../types/workflow';
import { apiService } from '../services/apiService';

interface WorkflowStore extends WorkflowState {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  setSelectedNode: (nodeId: string | null) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  executeWorkflow: () => Promise<void>;
  resetWorkflow: () => void;
  saveWorkflow: () => void;
  loadWorkflow: () => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
}

const getExecutionOrder = (nodes: Node[], edges: Edge[]): string[] => {
  // Simple topological sort for workflow execution order
  const adjacencyList: { [key: string]: string[] } = {};
  const inDegree: { [key: string]: number } = {};

  // Initialize
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
    inDegree[node.id] = 0;
  });

  // Build adjacency list and calculate in-degrees
  edges.forEach(edge => {
    adjacencyList[edge.source].push(edge.target);
    inDegree[edge.target]++;
  });

  // Topological sort using Kahn's algorithm
  const queue = nodes.filter(node => inDegree[node.id] === 0).map(node => node.id);
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    adjacencyList[current].forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
};

const validateWorkflow = (nodes: Node[], edges: Edge[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const startNodes = nodes.filter(n => n.data.type === 'start');
  const endNodes = nodes.filter(n => n.data.type === 'end');
  
  if (startNodes.length === 0) {
    errors.push('Workflow must have at least one start node');
  }
  
  if (startNodes.length > 1) {
    errors.push('Workflow can only have one start node');
  }
  
  if (endNodes.length === 0) {
    errors.push('Workflow must have at least one end node');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  isExecuting: false,
  executionOrder: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, type: 'smoothstep' }, get().edges)
    });
  },

  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    });
  },

  executeWorkflow: async () => {
    const { nodes, edges } = get();
    const validation = validateWorkflow(nodes, edges);
    
    if (!validation.isValid) {
      console.error('Workflow validation failed:', validation.errors);
      return;
    }
    
    const executionOrder = getExecutionOrder(nodes, edges);
    
    set({ isExecuting: true, executionOrder });

    let previousResult: any = null;

    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Skip start and end nodes for API execution
      if (node.data.type === 'start') {
        get().updateNodeData(nodeId, { 
          status: 'success',
          timestamp: new Date().toISOString()
        });
        continue;
      }
      
      if (node.data.type === 'end') {
        get().updateNodeData(nodeId, { 
          status: 'success',
          timestamp: new Date().toISOString(),
          response: { message: 'Workflow completed successfully', previousResult }
        });
        continue;
      }

      // Update node status to running
      get().updateNodeData(nodeId, { 
        status: 'running',
        response: null,
        error: undefined,
        timestamp: new Date().toISOString()
      });

      try {
        // Prepare request payload (include previous result if available)
        const requestPayload = {
          ...node.data.requestPayload,
          ...(previousResult && { previousStepResult: previousResult })
        };

        const startTime = Date.now();
        const response = await apiService.executeNode(node.data.apiEndpoint, requestPayload, nodeId);
        const executionTime = Date.now() - startTime;
        
        // Update node with success
        get().updateNodeData(nodeId, {
          status: 'success',
          response: response,
          requestPayload,
          executionTime,
          timestamp: new Date().toISOString()
        });

        previousResult = response.data;

      } catch (error) {
        // Update node with error
        get().updateNodeData(nodeId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        break; // Stop execution on error
      }
    }

    set({ isExecuting: false });
  },

  resetWorkflow: () => {
    set({
      nodes: get().nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: 'idle',
          response: null,
          error: undefined,
          executionTime: undefined,
          timestamp: undefined
        }
      })),
      isExecuting: false
    });
  },

  saveWorkflow: () => {
    const { nodes, edges } = get();
    const workflowData = {
      nodes,
      edges,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('idmscan-workflow', JSON.stringify(workflowData));
    console.log('Workflow saved to localStorage');
  },

  loadWorkflow: () => {
    const saved = localStorage.getItem('idmscan-workflow');
    if (saved) {
      try {
        const workflowData = JSON.parse(saved);
        const { nodes, edges } = workflowData;
        set({ nodes, edges });
        console.log('Workflow loaded from localStorage');
      } catch (error) {
        console.error('Failed to load workflow:', error);
      }
    }
  },

  exportWorkflow: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges }, null, 2);
  },

  importWorkflow: (json) => {
    try {
      const { nodes, edges } = JSON.parse(json);
      set({ nodes, edges });
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  }
}));