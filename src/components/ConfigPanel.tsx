import React, { useState, useEffect } from 'react';
import { Settings, X, Copy, Check, Code } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

export const ConfigPanel: React.FC = () => {
  const { selectedNode, nodes, edges, setSelectedNode } = useWorkflowStore();
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const getWorkflowJson = () => {
    const workflowData = {
      workflowName: `KYC_Flow_${Date.now()}`,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type === 'start' ? 'Start' :
              node.data.type === 'end' ? 'End' :
              node.data.type === 'liveness' ? 'Liveness Check' :
              node.data.type === 'cardCapture' ? 'Card Capture' :
              node.data.type === 'scanner' ? 'Scanner' : node.data.type,
        apiEndpoint: node.data.apiEndpoint || null,
        position: node.position,
        inputs: node.data.inputs || {},
        outputs: node.data.outputs || {},
        connections: edges.filter(e => e.source === node.id).map(e => e.target)
      }))
    };
    return JSON.stringify(workflowData, null, 2);
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

  if (!selectedNode || !selectedNodeData) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Workflow Info</h3>
          <button
            onClick={() => setShowJson(!showJson)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="View workflow JSON"
          >
            <Code className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {showJson ? (
          <div className="flex-1 p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Workflow JSON</h4>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl p-4 overflow-auto border border-gray-200">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
                {getWorkflowJson()}
              </pre>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Export Format:</strong> This JSON contains all node positions, types, inputs, and connections needed to reconstruct the workflow.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Settings className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-600 mb-2">No node selected</p>
            <p className="text-xs text-gray-500">Click a node to view details or use the JSON tab to see your workflow</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Node Details</h3>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Node Type
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-800">
              {selectedNodeData.data.type === 'start' ? 'Start' :
               selectedNodeData.data.type === 'end' ? 'End' :
               selectedNodeData.data.type === 'liveness' ? 'Liveness Check' :
               selectedNodeData.data.type === 'cardCapture' ? 'Card Capture' :
               selectedNodeData.data.type === 'scanner' ? 'Scanner' :
               selectedNodeData.data.type}
            </p>
          </div>
        </div>

        {selectedNodeData.data.apiEndpoint && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              API Endpoint
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-700 break-all">
              {selectedNodeData.data.apiEndpoint}
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-xs font-medium text-gray-700">Status:</span>
            <span className={`text-xs font-semibold ${
              selectedNodeData.data.status === 'success' ? 'text-green-600' :
              selectedNodeData.data.status === 'failed' ? 'text-red-600' :
              selectedNodeData.data.status === 'running' ? 'text-orange-600' :
              'text-blue-600'
            }`}>
              {selectedNodeData.data.status.charAt(0).toUpperCase() + selectedNodeData.data.status.slice(1)}
            </span>
          </div>
          {selectedNodeData.data.executionTime && (
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-700">Execution Time:</span>
              <span className="text-xs font-semibold text-gray-800">{selectedNodeData.data.executionTime}ms</span>
            </div>
          )}
          {selectedNodeData.data.timestamp && (
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-700">Last Updated:</span>
              <span className="text-xs font-semibold text-gray-800">
                {new Date(selectedNodeData.data.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {selectedNodeData.data.inputs && Object.keys(selectedNodeData.data.inputs).length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Inputs (Read-only)
            </label>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-40 overflow-auto">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(selectedNodeData.data.inputs, null, 2)}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">Edit inputs directly in the node on the canvas</p>
          </div>
        )}

        {selectedNodeData.data.response && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Response
            </label>
            <div className="bg-white rounded-lg p-3 border border-gray-200 max-h-40 overflow-auto">
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(selectedNodeData.data.response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {selectedNodeData.data.error && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Error
            </label>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <p className="text-xs text-red-600 font-mono">{selectedNodeData.data.error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
