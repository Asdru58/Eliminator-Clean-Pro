import React from 'react';
import { CheckSquare, Square, Trash2, Eraser, RotateCcw } from 'lucide-react';

import { formatBytes } from '../utils';

interface ActionSidebarProps {
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onKeepNewest: () => void;
    onKeepOldest: () => void;
    selectionCount: number;
    selectionSize: number;
    onDelete: (permanent: boolean) => void;
}

export function ActionSidebar({
    onSelectAll,
    onDeselectAll,
    onKeepNewest,
    onKeepOldest,
    selectionCount,
    selectionSize,
    onDelete
}: ActionSidebarProps) {
    return (
        <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Selección Rápida</h3>
                <div className="space-y-2">
                    <button
                        onClick={onKeepNewest}
                        className="w-full text-left px-3 py-2 bg-gray-700/50 hover:bg-blue-600 hover:text-white rounded transition-colors text-sm text-gray-200"
                    >
                        Conservar lo más nuevo
                    </button>
                    <button
                        onClick={onKeepOldest}
                        className="w-full text-left px-3 py-2 bg-gray-700/50 hover:bg-blue-600 hover:text-white rounded transition-colors text-sm text-gray-200"
                    >
                        Conservar lo más antiguo
                    </button>
                    <div className="h-px bg-gray-700 my-2"></div>
                    <button
                        onClick={onSelectAll}
                        className="w-full flex items-center px-3 py-2 bg-gray-700/50 hover:bg-gray-600 rounded transition-colors text-sm text-gray-200"
                    >
                        <CheckSquare size={16} className="mr-2" />
                        Seleccionar Todo
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="w-full flex items-center px-3 py-2 bg-gray-700/50 hover:bg-gray-600 rounded transition-colors text-sm text-gray-200"
                    >
                        <Square size={16} className="mr-2" />
                        Deseleccionar Todo
                    </button>
                </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones</h3>

                <div className="mb-4 text-center p-3 bg-blue-900/20 rounded border border-blue-900/50">
                    <span className="text-2xl font-bold text-blue-400 block">{selectionCount} files</span>
                    <span className="text-xs text-blue-300 font-mono mt-1 block">{formatBytes(selectionSize)}</span>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => onDelete(false)}
                        disabled={selectionCount === 0}
                        className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium shadow-sm"
                    >
                        <Trash2 size={18} className="mr-2" /> Mover a Papelera
                    </button>
                    <button
                        onClick={() => onDelete(true)}
                        disabled={selectionCount === 0}
                        className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium shadow-sm"
                    >
                        <Eraser size={18} className="mr-2" /> Eliminar Totalmente
                    </button>
                </div>
            </div>
        </div>
    );
}
