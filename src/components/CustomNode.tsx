import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, CheckCircle, XCircle, Loader2, Eye, CreditCard, PlayCircle, StopCircle, Clock } from 'lucide-react';
import { NodeData } from '../types/workflow';

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
  cardCapture: CreditCard
};

const nodeTypeColors = {
  start: 'bg-green-100 text-green-600',
  end: 'bg-red-100 text-red-600',
  liveness: 'bg-blue-100 text-blue-600',
  cardCapture: 'bg-purple-100 text-purple-600'
};

export const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  const StatusIcon = statusIcons[data.status];
  const TypeIcon = nodeTypeIcons[data.type];
  
  return (
    <div className={`
      relative min-w-[320px] rounded-lg border-2 transition-all duration-300 shadow-lg
      ${statusColors[data.status]}
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      backdrop-blur-sm
    `}>
      {data.type !== 'start' && (
        <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-white bg-blue-500"
        />
      )}
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className={`p-2 rounded-lg ${nodeTypeColors[data.type]}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{data.label}</h3>
          <p className="text-sm text-gray-500">
            {data.type === 'start' || data.type === 'end' ? 
              `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Node` : 
              data.apiEndpoint
            }
          </p>
        </div>
        <div className={`
          flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
          ${data.status === 'idle' ? 'bg-blue-100 text-blue-700' : ''}
          ${data.status === 'running' ? 'bg-orange-100 text-orange-700' : ''}
          ${data.status === 'success' ? 'bg-green-100 text-green-700' : ''}
          ${data.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
        `}>
          <StatusIcon className={`w-4 h-4 ${data.status === 'running' ? 'animate-spin' : ''}`} />
          {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Execution Time */}
        {data.executionTime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Execution time: {data.executionTime}ms</span>
          </div>
        )}

        {/* Timestamp */}
        {data.timestamp && (
          <div className="text-xs text-gray-500">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        )}

        {/* Request Payload - only for API nodes */}
        {data.type !== 'start' && data.type !== 'end' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Request</h4>
            <div className="bg-white rounded-md p-3 border">
              <pre className="text-xs text-gray-600 overflow-auto max-h-20">
                {JSON.stringify(data.requestPayload || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Response */}
        {(data.response || data.error) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Response</h4>
            <div className={`rounded-md p-3 border ${
              data.error ? 'bg-red-50 border-red-200' : 'bg-white'
            }`}>
              {data.error ? (
                <p className="text-xs text-red-600">{data.error}</p>
              ) : (
                <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                  {JSON.stringify(data.response, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {data.type !== 'end' && (
        <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white bg-blue-500"
        />
      )}
    </div>
  );
};