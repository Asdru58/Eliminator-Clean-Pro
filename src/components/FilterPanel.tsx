import React from 'react';
import { FileText, Image, Film, File } from 'lucide-react';

interface FilterPanelProps {
    filters: Set<string>;
    setFilters: (filters: Set<string>) => void;
}

export function FilterPanel({ filters, setFilters }: FilterPanelProps) {
    const toggleFilter = (filter: string) => {
        const newFilters = new Set(filters);
        if (newFilters.has(filter)) {
            newFilters.delete(filter);
        } else {
            newFilters.add(filter);
        }
        setFilters(newFilters);
    };

    const isChecked = (filter: string) => filters.has(filter);

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Filtros de Búsqueda</h3>
            <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors group">
                    <input
                        type="checkbox"
                        checked={isChecked('document')}
                        onChange={() => toggleFilter('document')}
                        className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-700 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <div className="flex items-center text-gray-300 group-hover:text-white">
                        <FileText size={16} className="mr-2" />
                        <span>Documentos</span>
                    </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors group">
                    <input
                        type="checkbox"
                        checked={isChecked('image')}
                        onChange={() => toggleFilter('image')}
                        className="form-checkbox h-4 w-4 text-purple-500 rounded border-gray-600 bg-gray-700 focus:ring-purple-500 focus:ring-offset-gray-800"
                    />
                    <div className="flex items-center text-gray-300 group-hover:text-white">
                        <Image size={16} className="mr-2" />
                        <span>Imágenes</span>
                    </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors group">
                    <input
                        type="checkbox"
                        checked={isChecked('video')}
                        onChange={() => toggleFilter('video')}
                        className="form-checkbox h-4 w-4 text-pink-500 rounded border-gray-600 bg-gray-700 focus:ring-pink-500 focus:ring-offset-gray-800"
                    />
                    <div className="flex items-center text-gray-300 group-hover:text-white">
                        <Film size={16} className="mr-2" />
                        <span>Videos</span>
                    </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors group">
                    <input
                        type="checkbox"
                        checked={isChecked('other')}
                        onChange={() => toggleFilter('other')}
                        className="form-checkbox h-4 w-4 text-gray-500 rounded border-gray-600 bg-gray-700 focus:ring-gray-500 focus:ring-offset-gray-800"
                    />
                    <div className="flex items-center text-gray-300 group-hover:text-white">
                        <File size={16} className="mr-2" />
                        <span>Otros</span>
                    </div>
                </label>
            </div>
        </div>
    );
}
