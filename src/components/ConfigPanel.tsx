import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Code, Copy, Check } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

export const ConfigPanel: React.FC = () => {
  const { selectedNode, nodes, edges, updateNodeData, setSelectedNode } = useWorkflowStore();
  const [config, setConfig] = useState({
    label: '',
    apiEndpoint: '',
    requestPayload: '{}'
  });
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  useEffect(() => {
    if (selectedNodeData) {
      setConfig({
        label: selectedNodeData.data.label,
        apiEndpoint: selectedNodeData.data.apiEndpoint,
        requestPayload: JSON.stringify(selectedNodeData.data.requestPayload || {}, null, 2)
      });
    }
  }, [selectedNodeData]);

  const handleSave = () => {
    if (!selectedNode) return;

    try {
      const requestPayload = JSON.parse(config.requestPayload);
      updateNodeData(selectedNode, {
        label: config.label,
        apiEndpoint: config.apiEndpoint,
        requestPayload
      });
      alert('Configuration saved successfully!');
    } catch (error) {
      alert('Invalid JSON in request payload');
    }
  };

  const getWorkflowJson = () => {
    const workflowData = {
      workflow: {
        id: `workflow_${Date.now()}`,
        name: "IDMScan Workflow",
        created: new Date().toISOString(),
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.type,
          label: node.data.label,
          apiEndpoint: node.data.apiEndpoint,
          requestPayload: node.data.requestPayload,
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target
        })),
        executionOrder: getExecutionOrder()
      }
    };
    return JSON.stringify(workflowData, null, 2);
  };

  const getExecutionOrder = () => {
    // Simple topological sort for execution order
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

    // Topological sort
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getWorkflowJson());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleClose = () => {
    setSelectedNode(null);
  };

  const isStartOrEndNode = selectedNodeData?.data.type === 'start' || selectedNodeData?.data.type === 'end';

  if (!selectedNode || !selectedNodeData) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Workflow JSON</h3>
          <button
            onClick={() => setShowJson(!showJson)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
        
        {showJson ? (
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700">FastAPI Workflow JSON</h4>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {getWorkflowJson()}
              </pre>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>FastAPI Integration:</strong> Use this JSON structure to define workflow execution order and node configurations in your backend microservices.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Select a node to configure</p>
              <p className="text-xs text-gray-400 mt-2">or click JSON icon to view workflow</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showJson) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Workflow JSON</h3>
          <button
            onClick={() => setShowJson(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">FastAPI Workflow JSON</h4>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {getWorkflowJson()}
            </pre>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>FastAPI Integration:</strong> Use this JSON structure to define workflow execution order and node configurations in your backend microservices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Node Configuration</h3>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Label
          </label>
          <input
            type="text"
            value={config.label}
            onChange={(e) => setConfig({ ...config, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {!isStartOrEndNode && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint
              </label>
              <input
                type="text"
                value={config.apiEndpoint}
                onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Payload (JSON)
              </label>
              <textarea
                value={config.requestPayload}
                onChange={(e) => setConfig({ ...config, requestPayload: e.target.value })}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </>
        )}

        {/* Node Status Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Node Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{selectedNodeData.data.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                selectedNodeData.data.status === 'success' ? 'text-green-600' :
                selectedNodeData.data.status === 'failed' ? 'text-red-600' :
                selectedNodeData.data.status === 'running' ? 'text-orange-600' :
                'text-blue-600'
              }`}>
                {selectedNodeData.data.status}
              </span>
            </div>
            {selectedNodeData.data.executionTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Execution Time:</span>
                <span className="font-medium">{selectedNodeData.data.executionTime}ms</span>
              </div>
            )}
            {selectedNodeData.data.timestamp && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium text-xs">
                  {new Date(selectedNodeData.data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </div>
    </div>
  );
};