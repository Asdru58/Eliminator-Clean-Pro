import { open } from '@tauri-apps/plugin-dialog';
import { FolderPlus, X } from 'lucide-react';

interface FolderSelectorProps {
    folders: string[];
    setFolders: (folders: string[]) => void;
}

export function FolderSelector({ folders, setFolders }: FolderSelectorProps) {
    const handleAddFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: true,
            });
            if (selected) {
                const newFolders = Array.isArray(selected) ? selected : [selected];
                // Filter out duplicates
                setFolders([...new Set([...folders, ...newFolders])]);
            }
        } catch (error) {
            console.error("Error selecting folder:", error);
        }
    };

    const removeFolder = (folder: string) => {
        setFolders(folders.filter((f) => f !== folder));
    };

    return (
        <div className="p-4 bg-white/5 rounded-xl shadow-lg border border-white/10 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Carpetas a Escanear</h2>
                <button
                    onClick={handleAddFolder}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                >
                    <FolderPlus size={20} />
                    Añadir Carpeta
                </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {folders.length === 0 && (
                    <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded-md">
                        <p>No hay carpetas seleccionadas.</p>
                        <p className="text-sm">Añade una carpeta para comenzar.</p>
                    </div>
                )}
                {folders.map((folder) => (
                    <div key={folder} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors">
                        <span className="text-gray-200 truncate flex-1 mr-4 font-mono text-sm" title={folder}>{folder}</span>
                        <button
                            onClick={() => removeFolder(folder)}
                            className="text-red-400 hover:text-red-300 p-1.5 hover:bg-gray-600 rounded-full transition-colors"
                            title="Eliminar"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
