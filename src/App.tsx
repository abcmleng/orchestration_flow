import React, { useCallback, useRef, useEffect, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  ConnectionMode,
  Node,
  useReactFlow,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from './store/workflowStore';
import { CustomNode } from './components/CustomNode';
import { Sidebar } from './components/Sidebar';
import { ConfigPanel } from './components/ConfigPanel';
import { NodeData } from './types/workflow';

const nodeTypes = {
  customNode: CustomNode
};

const WorkflowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    setSelectedNode
  } = useWorkflowStore();
  
  const { project } = useReactFlow();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onInit = useCallback((rfi: ReactFlowInstance) => {
    reactFlowInstance.current = rfi;
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const templateData = event.dataTransfer.getData('application/reactflow');

      if (!templateData) return;

      const template = JSON.parse(templateData);
      const rawPosition = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const position = {
        x: Math.round(rawPosition.x / 20) * 20,
        y: Math.round(rawPosition.y / 20) * 20,
      };

      const newNode: Node<NodeData> = {
        id: `${template.type}-${Date.now()}`,
        type: 'customNode',
        position,
        data: {
          id: `${template.type}-${Date.now()}`,
          type: template.type,
          label: template.label,
          apiEndpoint: template.apiEndpoint,
          requestPayload: template.defaultPayload,
          status: 'idle'
        }
      };

      setNodes([...nodes, newNode]);
    },
    [nodes, project, setNodes]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="flex-1 flex">
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#3B82F6' },
            animated: true
          }}
          snapToGrid={true}
          snapGrid={[20, 20]}
          fitView
          className="bg-gray-50"
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#E5E7EB" gap={20} size={1} variant="dots" />
          <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.status) {
                case 'running': return '#F97316';
                case 'success': return '#10B981';
                case 'failed': return '#EF4444';
                default: return '#3B82F6';
              }
            }}
            className="bg-white border border-gray-200 rounded-lg shadow-sm"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>
      <ConfigPanel />
    </div>
  );
};

const App: React.FC = () => {
  const { loadWorkflow } = useWorkflowStore();

  useEffect(() => {
    // Load saved workflow on app start
    loadWorkflow();
  }, [loadWorkflow]);

  return (
    <div className="h-screen flex bg-gray-100">
      <ReactFlowProvider>
        <Sidebar />
        <WorkflowCanvas />
      </ReactFlowProvider>
    </div>
  );
};

export default App;