import React from 'react';
import { Eye, CreditCard, Play, RotateCcw, Download, Upload, Save, PlayCircle, StopCircle, Scan } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

const defaultMultipartInput = {
  token: 'Sandip-Test',
  latitude: 0.0,
  longitude: 0.0,
  user_agent: 'Mozilla/5.0',
  file: '/path/to/file.jpg'
};

const nodeTemplates = [
  {
    type: 'start',
    label: 'Start',
    icon: PlayCircle,
    apiEndpoint: null,
    defaultInputs: {},
    color: 'green'
  },
  {
    type: 'liveness',
    label: 'Liveness Check',
    icon: Eye,
    apiEndpoint: '/jdmscan/liveness',
    defaultInputs: defaultMultipartInput,
    color: 'blue'
  },
  {
    type: 'cardCapture',
    label: 'Card Capture',
    icon: CreditCard,
    apiEndpoint: '/ml/document',
    defaultInputs: {
      ...defaultMultipartInput,
      metadataIndex: 2702,
      user_agent: undefined
    },
    color: 'purple'
  },
  {
    type: 'scanner',
    label: 'Scanner',
    icon: Scan,
    apiEndpoint: '/jdmscan/scanner',
    defaultInputs: defaultMultipartInput,
    color: 'orange',
    description: 'MRZ or Barcode scanning'
  },
  {
    type: 'end',
    label: 'End',
    icon: StopCircle,
    apiEndpoint: null,
    defaultInputs: {},
    color: 'red'
  }
];

export const Sidebar: React.FC = () => {
  const { 
    executeWorkflow, 
    resetWorkflow, 
    isExecuting, 
    saveWorkflow, 
    loadWorkflow,
    exportWorkflow,
    importWorkflow,
    nodes
  } = useWorkflowStore();

  const onDragStart = (event: React.DragEvent, template: typeof nodeTemplates[0]) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleExport = () => {
    const json = exportWorkflow();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'idmscan-workflow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const json = e.target?.result as string;
        importWorkflow(json);
      };
      reader.readAsText(file);
    }
  };

  const canExecute = nodes.length > 0 && !isExecuting;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">IDMScan Workflow</h2>
        <p className="text-sm text-gray-600">Drag nodes to canvas to build your workflow</p>
      </div>

      {/* Node Templates */}
      <div className="flex-1 p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Process Nodes
        </h3>
        <div className="space-y-3">
          {nodeTemplates.map((template) => {
            const Icon = template.icon;
            const getNodeColor = () => {
              switch (template.type) {
                case 'start': return 'border-green-300 hover:border-green-400 hover:bg-green-50 hover:shadow-md';
                case 'end': return 'border-red-300 hover:border-red-400 hover:bg-red-50 hover:shadow-md';
                case 'liveness': return 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md';
                case 'cardCapture': return 'border-purple-300 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md';
                case 'scanner': return 'border-orange-300 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md';
                default: return 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md';
              }
            };

            const getIconColor = () => {
              switch (template.type) {
                case 'start': return 'bg-green-100 text-green-600';
                case 'end': return 'bg-red-100 text-red-600';
                case 'liveness': return 'bg-blue-100 text-blue-600';
                case 'cardCapture': return 'bg-purple-100 text-purple-600';
                case 'scanner': return 'bg-orange-100 text-orange-600';
                default: return 'bg-gray-100 text-gray-600';
              }
            };
            
            return (
              <div
                key={template.type}
                draggable
                onDragStart={(e) => onDragStart(e, template as typeof nodeTemplates[0])}
                className={`flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-dashed cursor-grab transition-all duration-200 ${getNodeColor()}`}
              >
                <div className={`p-2 rounded-lg ${getIconColor()}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{template.label}</h4>
                  <p className="text-xs text-gray-500">
                    {template.apiEndpoint || `${template.type.charAt(0).toUpperCase() + template.type.slice(1)} node`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        <button
          onClick={executeWorkflow}
          disabled={!canExecute}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors
            ${canExecute
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Play className="w-4 h-4" />
          {isExecuting ? 'Executing...' : 'Run Workflow'}
        </button>

        <button
          onClick={resetWorkflow}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <div className="flex gap-2">
          <button
            onClick={saveWorkflow}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={loadWorkflow}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Load
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};