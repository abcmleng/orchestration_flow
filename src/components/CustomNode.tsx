import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, CheckCircle, XCircle, Loader2, Eye, CreditCard, PlayCircle, StopCircle, Clock, Scan, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { NodeData } from '../types/workflow';
import { useWorkflowStore } from '../store/workflowStore';

const statusColors = {
  idle: 'border-blue-300 bg-blue-50',
  running: 'border-orange-300 bg-orange-50',
  success: 'border-green-300 bg-green-50',
  failed: 'border-red-300 bg-red-50'
};

const statusIcons = {
  idle: Play,
  running: Loader2,
  success: CheckCircle,
  failed: XCircle
};

const nodeTypeIcons = {
  start: PlayCircle,
  end: StopCircle,
  liveness: Eye,
  cardCapture: CreditCard,
  scanner: Scan
};

const nodeTypeColors = {
  start: 'bg-green-100 text-green-600',
  end: 'bg-red-100 text-red-600',
  liveness: 'bg-blue-100 text-blue-600',
  cardCapture: 'bg-purple-100 text-purple-600',
  scanner: 'bg-orange-100 text-orange-600'
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'start': return 'Start';
    case 'end': return 'End';
    case 'liveness': return 'Liveness Check';
    case 'cardCapture': return 'Card Capture';
    case 'scanner': return 'Scanner';
    default: return type;
  }
};

export const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected, isConnectable }) => {
  const StatusIcon = statusIcons[data.status];
  const TypeIcon = nodeTypeIcons[data.type as keyof typeof nodeTypeIcons];
  const { updateNodeData } = useWorkflowStore();
  const [showInputs, setShowInputs] = useState(false);
  const [inputJson, setInputJson] = useState(JSON.stringify(data.inputs || {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleInputChange = (value: string) => {
    setInputJson(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON');
    }
  };

  const handleSaveInputs = () => {
    try {
      const parsed = JSON.parse(inputJson);
      updateNodeData(data.id, { inputs: parsed });
      setShowInputs(false);
    } catch (error) {
      setJsonError('Failed to save: Invalid JSON');
    }
  };

  const isStartOrEnd = data.type === 'start' || data.type === 'end';

  return (
    <div className={`
      w-96 rounded-2xl border-2 transition-all duration-300 shadow-lg hover:shadow-xl
      ${statusColors[data.status]}
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : 'scale-100'}
      bg-white overflow-hidden flex flex-col
    `}>
      {data.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 border-2 border-white bg-blue-500"
          isConnectable={isConnectable}
        />
      )}

      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <div className={`p-2.5 rounded-xl ${nodeTypeColors[data.type as keyof typeof nodeTypeColors]}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{getTypeLabel(data.type)}</h3>
            {data.apiEndpoint && (
              <p className="text-xs text-gray-500 truncate font-mono">{data.apiEndpoint}</p>
            )}
          </div>
          <div className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap
            ${data.status === 'idle' ? 'bg-blue-100 text-blue-700' : ''}
            ${data.status === 'running' ? 'bg-orange-100 text-orange-700' : ''}
            ${data.status === 'success' ? 'bg-green-100 text-green-700' : ''}
            ${data.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
          `}>
            <StatusIcon className={`w-3 h-3 ${data.status === 'running' ? 'animate-spin' : ''}`} />
            <span>{data.status.charAt(0).toUpperCase() + data.status.slice(1)}</span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-64">
          {data.executionTime && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>Execution: {data.executionTime}ms</span>
            </div>
          )}

          {!isStartOrEnd && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Inputs</h4>
                <button
                  onClick={() => setShowInputs(!showInputs)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={showInputs ? 'Hide inputs' : 'Show inputs'}
                >
                  {showInputs ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
              </div>

              {showInputs ? (
                <div className="space-y-2">
                  <textarea
                    value={inputJson}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={`
                      w-full px-3 py-2 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
                      max-h-40 resize-vertical
                    `}
                    rows={4}
                  />
                  {jsonError && (
                    <p className="text-xs text-red-600">{jsonError}</p>
                  )}
                  <button
                    onClick={handleSaveInputs}
                    disabled={!!jsonError}
                    className={`
                      w-full text-xs font-medium py-1.5 rounded-lg transition-colors
                      ${jsonError
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      }
                    `}
                  >
                    Save Inputs
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-24 overflow-auto">
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(data.inputs || {}, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {(data.response || data.error) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Response</h4>
              <div className={`
                rounded-lg p-3 border max-h-24 overflow-auto
                ${data.error ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}
              `}>
                {data.error ? (
                  <p className="text-xs text-red-600 font-mono">{data.error}</p>
                ) : (
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(data.response, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {data.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 border-2 border-white bg-blue-500"
          isConnectable={isConnectable}
        />
      )}
    </div>
  );
};
