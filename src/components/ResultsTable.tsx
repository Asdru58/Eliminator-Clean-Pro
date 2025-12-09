import { DuplicateGroup } from '../types';
import { formatBytes } from '../utils';
import { File, CheckSquare, Square, Film } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import clsx from 'clsx';

interface ResultsTableProps {
    results: DuplicateGroup[];
    selection: Set<string>;
    toggleSelection: (path: string) => void;
}

export function ResultsTable({ results, selection, toggleSelection }: ResultsTableProps) {
    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                <File size={48} className="mb-4 opacity-50" />
                <p>No se encontraron duplicados (o aún no has escaneado).</p>
            </div>
        );
    }

    const isMedia = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
    };

    const isVideo = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase();
        return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext || '');
    };

    return (
        <div className="space-y-6 pb-20">
            {results.map((group, index) => (
                <div key={group.hash} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
                    <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded font-mono">Grupo #{index + 1}</span>
                            <span className="text-xs font-mono text-gray-500" title={group.hash}>Hash: {group.hash.substring(0, 12)}...</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-400">{formatBytes(group.files[0].size)}</span>
                    </div>
                    <div className="divide-y divide-gray-700">
                        {group.files.map((file) => {
                            const isSelected = selection.has(file.path);
                            const showThumb = isMedia(file.path);
                            const showVideoIcon = isVideo(file.path);

                            return (
                                <div
                                    key={file.path}
                                    className={clsx(
                                        "flex items-center p-3 hover:bg-gray-700/50 transition-colors cursor-pointer select-none",
                                        isSelected && "bg-red-900/10"
                                    )}
                                    onClick={() => toggleSelection(file.path)}
                                >
                                    <div className="mr-4 text-gray-400">
                                        {isSelected ? <CheckSquare className="text-red-500" size={20} /> : <Square size={20} />}
                                    </div>

                                    {showThumb && (
                                        <div className="w-16 h-16 mr-4 bg-gray-900 rounded overflow-hidden flex-shrink-0 border border-gray-600">
                                            <img src={convertFileSrc(file.path)} alt="preview" className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    )}

                                    {showVideoIcon && (
                                        <div className="w-16 h-16 mr-4 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 border border-gray-600 text-gray-500">
                                            <Film size={24} />
                                        </div>
                                    )}

                                    {!showThumb && !showVideoIcon && (
                                        <div className="w-16 h-16 mr-4 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 border border-gray-600 text-gray-500">
                                            <File size={24} />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-200 truncate font-mono" title={file.path}>{file.path}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Modificado: {new Date(file.modified * 1000).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
