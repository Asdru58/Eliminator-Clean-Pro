import React from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { FileInfo } from '../types';
import { formatBytes } from '../utils';
import { File, Calendar, HardDrive } from 'lucide-react';

interface PreviewPanelProps {
    file: FileInfo | null;
}

export function PreviewPanel({ file }: PreviewPanelProps) {
    if (!file) {
        return (
            <div className="h-full bg-gray-800 rounded-lg border border-gray-700 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                <div className="bg-gray-700/50 p-6 rounded-full mb-4">
                    <File size={64} className="opacity-50" />
                </div>
                <p className="text-lg font-medium">Sin vista previa</p>
                <p className="text-sm mt-2 max-w-xs">Selecciona un archivo de la lista de resultados para ver sus detalles</p>
            </div>
        );
    }

    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.path);
    const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(file.path);

    const assetUrl = convertFileSrc(file.path);

    return (
        <div className="h-full w-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col backdrop-blur-md shadow-2xl">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-gray-200 truncate flex-1 mr-4" title={file.path}>
                    {file.path.split(/[\\/]/).pop()}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                    {file.path.split('.').pop()?.toUpperCase()}
                </span>
            </div>

            <div className="flex-1 bg-black/20 flex items-center justify-center p-4 overflow-hidden relative group">
                {isImage && (
                    <img
                        src={assetUrl}
                        alt="preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                )}
                {isVideo && (
                    <video
                        src={assetUrl}
                        className="max-w-full max-h-full rounded-lg shadow-2xl"
                        controls
                    />
                )}
                {!isImage && !isVideo && (
                    <div className="flex flex-col items-center text-gray-400 p-8 border border-white/10 bg-white/5 rounded-2xl backdrop-blur-sm">
                        <File size={64} className="mb-4 text-gray-500" />
                        <p className="font-medium">Vista previa no disponible</p>
                    </div>
                )}

                {/* Overlay for long paths */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform backdrop-blur-md border-t border-white/10">
                    <p className="text-xs text-blue-200 break-all font-mono">{file.path}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 bg-white/5">
                <div className="p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                    <HardDrive size={20} className="mb-2 text-blue-400" />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Tamaño</p>
                    <p className="text-sm font-semibold text-gray-200">{formatBytes(file.size)}</p>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                    <Calendar size={20} className="mb-2 text-purple-400" />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Modificado</p>
                    <p className="text-sm font-semibold text-gray-200">{new Date(file.modified * 1000).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
