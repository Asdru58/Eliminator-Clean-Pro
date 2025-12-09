import { DuplicateGroup, FileInfo } from '../types';
import { formatBytes } from '../utils';
import { File, CheckSquare, Square, Film, Image } from 'lucide-react';
import clsx from 'clsx';

interface ResultsTableProps {
    results: DuplicateGroup[];
    selection: Set<string>;
    toggleSelection: (path: string) => void;
    onFocusFile: (file: FileInfo) => void;
    focusedFileId?: string;
}

export function ResultsTable({ results, selection, toggleSelection, onFocusFile, focusedFileId }: ResultsTableProps) {
    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10">
                <File size={48} className="mb-4 opacity-30" />
                <p>No se encontraron duplicados</p>
                <p className="text-sm mt-1">Selecciona carpetas e inicia el escaneo</p>
            </div>
        );
    }

    const getIcon = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <Image size={16} className="text-purple-400" />;
        if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return <Film size={16} className="text-pink-400" />;
        return <File size={16} className="text-blue-400" />;
    };

    return (
        <div className="space-y-6 pb-4">
            {results.map((group, index) => (
                <div key={group.hash} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden backdrop-blur-sm transition-colors hover:bg-white/10">
                    <div className="bg-gray-900/30 px-3 py-1.5 border-b border-gray-700 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500">#{index + 1}</span>
                            <span className="text-gray-400 font-mono" title={group.hash}>{group.hash.substring(0, 8)}</span>
                        </div>
                        <span className="text-blue-400 font-medium">{formatBytes(group.files[0].size)}</span>
                    </div>
                    <div className="divide-y divide-gray-700/50">
                        {group.files.map((file) => {
                            const isSelected = selection.has(file.path);
                            const isFocused = focusedFileId === file.path;

                            return (
                                <div
                                    key={file.path}
                                    className={clsx(
                                        "flex items-center px-3 py-2 transition-all cursor-pointer select-none text-sm group relative",
                                        isSelected && "bg-blue-900/10",
                                        isFocused && "bg-blue-900/20 ring-1 ring-inset ring-blue-500/30",
                                        !isSelected && !isFocused && "hover:bg-gray-700/30"
                                    )}
                                    onClick={() => onFocusFile(file)}
                                >
                                    <button
                                        className={clsx(
                                            "mr-3 p-0.5 rounded transition-colors z-10",
                                            isSelected ? "text-blue-500 hover:text-blue-400" : "text-gray-600 hover:text-gray-400"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelection(file.path);
                                        }}
                                    >
                                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>

                                    <div className="mr-3 opacity-70">
                                        {getIcon(file.path)}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className={clsx(
                                            "truncate font-mono transition-colors",
                                            isSelected ? "text-blue-100" : "text-gray-300"
                                        )} title={file.path}>
                                            {file.path}
                                        </p>
                                    </div>

                                    <div className="text-xs text-gray-600 whitespace-nowrap hidden sm:block">
                                        {new Date(file.modified * 1000).toLocaleDateString()}
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
