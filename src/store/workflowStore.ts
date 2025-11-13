import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge } from 'reactflow';
import { NodeData, WorkflowState } from '../types/workflow';
import { apiService } from '../services/apiService';

interface WorkflowStore extends WorkflowState {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  setSelectedNode: (nodeId: string | null) => void;
  updateNodeData: (nodeId: string, data: Partial<Omit<NodeData, 'id' | 'type'>>) => void;
  executeWorkflow: () => Promise<void>;
  resetWorkflow: () => void;
  saveWorkflow: () => void;
  loadWorkflow: () => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
}

const getExecutionOrder = (nodes: Node[], edges: Edge[]): string[] => {
  const adjacencyList: { [key: string]: string[] } = {};
  const inDegree: { [key: string]: number } = {};

  nodes.forEach(node => {
    adjacencyList[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach(edge => {
    adjacencyList[edge.source].push(edge.target);
    inDegree[edge.target]++;
  });

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
  const scannerNodes = nodes.filter(n => n.data.type === 'scanner');

  if (startNodes.length === 0) {
    errors.push('Workflow must have exactly one start node');
  }

  if (startNodes.length > 1) {
    errors.push('Workflow can only have one start node');
  }

  if (endNodes.length === 0) {
    errors.push('Workflow must have exactly one end node');
  }

  if (endNodes.length > 1) {
    errors.push('Workflow can only have one end node');
  }

  for (const scanner of scannerNodes) {
    const incomingEdges = edges.filter(e => e.target === scanner.id);
    if (incomingEdges.length !== 1) {
      errors.push(`Scanner node must have exactly one incoming connection`);
    } else {
      const sourceNode = nodes.find(n => n.id === incomingEdges[0].source);
      if (sourceNode?.data.type !== 'cardCapture') {
        errors.push(`Scanner node must connect directly from Card Capture node`);
      }
    }
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
    const { nodes, edges } = get();
    const targetNode = nodes.find(n => n.id === connection.target);
    const sourceNode = nodes.find(n => n.id === connection.source);

    if (targetNode?.data.type === 'scanner') {
      if (sourceNode?.data.type !== 'cardCapture') {
        alert('Scanner node must connect immediately after Card Capture node only!');
        return;
      }
      const existingCardCaptureConnections = edges.filter(e => e.target === connection.target);
      if (existingCardCaptureConnections.length > 0) {
        alert('Scanner already has an incoming connection');
        return;
      }
    }

    if (sourceNode?.data.type === 'cardCapture') {
      const existingScannerConnection = edges.find(
        e => e.source === connection.source &&
        nodes.find(n => n.id === e.target)?.data.type === 'scanner'
      );
      if (existingScannerConnection && connection.target !== existingScannerConnection.target) {
        alert('Card Capture can only connect to one Scanner node');
        return;
      }
    }

    set({
      edges: addEdge({ ...connection, type: 'smoothstep' }, edges)
    });
  },

  setSelectedNode: (nodeId) => {
    set({ selectedNode: nodeId });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...data,
                id: node.data.id,
                type: node.data.type
              }
            }
          : node
      )
    });
  },

  executeWorkflow: async () => {
    const { nodes, edges } = get();
    const validation = validateWorkflow(nodes, edges);

    if (!validation.isValid) {
      alert('Workflow validation failed: ' + validation.errors.join(', '));
      console.error('Workflow validation failed:', validation.errors);
      return;
    }

    for (const node of nodes) {
      if (node.data.type === 'scanner') {
        const incomingEdges = edges.filter(e => e.target === node.id);
        if (incomingEdges.length !== 1) {
          alert('Scanner node must have exactly one incoming connection from Card Capture');
          return;
        }
        const sourceNode = nodes.find(n => n.id === incomingEdges[0].source);
        if (sourceNode?.data.type !== 'cardCapture') {
          alert('Scanner node must connect directly from Card Capture node');
          return;
        }
      }
    }

    const executionOrder = getExecutionOrder(nodes, edges);

    set({ isExecuting: true, executionOrder });

    let previousResult: any = null;

    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

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

      get().updateNodeData(nodeId, {
        status: 'running',
        response: undefined,
        error: undefined,
        timestamp: new Date().toISOString()
      });

      try {
        const startTime = Date.now();
        const response = await apiService.executeNode(node.data.apiEndpoint || '', node.data.inputs || {}, nodeId);
        const executionTime = Date.now() - startTime;

        get().updateNodeData(nodeId, {
          status: 'success',
          response: response,
          inputs: node.data.inputs || {},
          executionTime,
          timestamp: new Date().toISOString()
        });

        previousResult = response.data;

      } catch (error) {
        get().updateNodeData(nodeId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        break;
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
          status: 'idle' as const,
          response: undefined,
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
      nodes: nodes.map(n => ({
        id: n.id,
        type: 'customNode',
        position: n.position,
        data: {
          id: n.data.id,
          type: n.data.type,
          label: n.data.label,
          apiEndpoint: n.data.apiEndpoint,
          inputs: n.data.inputs || {},
          outputs: n.data.outputs || {},
          status: 'idle'
        }
      })),
      edges,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('idmscan-workflow', JSON.stringify(workflowData));
    alert('Workflow saved successfully!');
    console.log('Workflow saved to localStorage');
  },

  loadWorkflow: () => {
    const saved = localStorage.getItem('idmscan-workflow');
    if (saved) {
      try {
        const workflowData = JSON.parse(saved);
        const { nodes, edges } = workflowData;
        if (nodes && edges) {
          set({ nodes, edges });
          console.log('Workflow loaded from localStorage');
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
      }
    }
  },

  exportWorkflow: () => {
    const { nodes, edges } = get();
    const workflowData = {
      workflowName: `KYC_Flow_${Date.now()}`,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type === 'start' ? 'Start' :
              node.data.type === 'end' ? 'End' :
              node.data.type === 'liveness' ? 'Liveness Check' :
              node.data.type === 'cardCapture' ? 'Card Capture' :
              node.data.type === 'scanner' ? 'Scanner' : node.data.type,
        apiEndpoint: node.data.apiEndpoint,
        position: node.position,
        inputs: node.data.inputs || {},
        outputs: node.data.outputs || {},
        connections: edges.filter(e => e.source === node.id).map(e => e.target)
      }))
    };
    return JSON.stringify(workflowData, null, 2);
  },

  importWorkflow: (json) => {
    try {
      const data = JSON.parse(json);

      if (data.workflowName && data.nodes && Array.isArray(data.nodes)) {
        const typeMapping: { [key: string]: string } = {
          'Start': 'start',
          'End': 'end',
          'Liveness Check': 'liveness',
          'Card Capture': 'cardCapture',
          'Scanner': 'scanner'
        };

        const importedNodes = data.nodes.map((node: any) => {
          const nodeType = typeMapping[node.type] || node.type;
          return {
            id: node.id,
            type: 'customNode',
            position: node.position || { x: 0, y: 0 },
            data: {
              id: node.id,
              type: nodeType,
              label: node.type,
              apiEndpoint: node.apiEndpoint || null,
              inputs: node.inputs || {},
              outputs: node.outputs || {},
              status: 'idle' as const
            }
          };
        });

        const importedEdges: Edge[] = [];
        data.nodes.forEach((node: any) => {
          if (node.connections && Array.isArray(node.connections)) {
            node.connections.forEach((targetId: string) => {
              importedEdges.push({
                id: `${node.id}-${targetId}`,
                source: node.id,
                target: targetId,
                type: 'smoothstep'
              });
            });
          }
        });

        set({ nodes: importedNodes, edges: importedEdges });
        alert('Workflow imported successfully!');
        console.log('Workflow imported successfully');
      } else if (data.nodes && data.edges) {
        set({ nodes: data.nodes, edges: data.edges });
      } else {
        throw new Error('Invalid workflow format');
      }
    } catch (error) {
      console.error('Failed to import workflow:', error);
      alert('Failed to import workflow. Please check the JSON format.');
    }
  }
}));
