import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { FolderSelector } from "./components/FolderSelector";
import { ResultsTable } from "./components/ResultsTable";
import { DuplicateGroup } from "./types";
import { Trash2, Play, AlertTriangle, Eraser, XCircle } from "lucide-react";
import { formatBytes } from "./utils";

interface ProgressEvent {
  phase: string;
  current: number;
  total: number;
}

function App() {
  const [folders, setFolders] = useState<string[]>([]);
  const [results, setResults] = useState<DuplicateGroup[]>([]);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [stats, setStats] = useState<{ freed: number; count: number } | null>(null);

  useEffect(() => {
    const unlisten = listen<ProgressEvent>("scan-progress", (event) => {
      setProgress(event.payload);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleScan = async () => {
    if (folders.length === 0) return;
    setIsScanning(true);
    setScanError(null);
    setResults([]);
    setSelection(new Set());
    setStats(null);
    setProgress({ phase: "Iniciando...", current: 0, total: 0 });

    try {
      const data = await invoke<DuplicateGroup[]>("scan_files", { paths: folders });
      setResults(data);
      // Auto-select newest by default
      autoSelect('newest', data);
    } catch (e) {
      if (String(e).includes("Cancelled")) {
        setScanError("Escaneo cancelado por el usuario.");
      } else {
        setScanError(String(e));
      }
    } finally {
      setIsScanning(false);
      setProgress(null);
    }
  };

  const handleCancel = async () => {
    await invoke("cancel_scan");
  };

  const toggleSelection = (path: string) => {
    const newSelection = new Set(selection);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    setSelection(newSelection);
  };

  const autoSelect = (strategy: 'newest' | 'oldest' | 'shortest', currentResults = results) => {
    const newSelection = new Set<string>();

    currentResults.forEach(group => {
      if (group.files.length < 2) return;

      let sorted = [...group.files];
      if (strategy === 'newest') {
        sorted.sort((a, b) => b.modified - a.modified);
      } else if (strategy === 'oldest') {
        sorted.sort((a, b) => a.modified - b.modified);
      } else if (strategy === 'shortest') {
        sorted.sort((a, b) => a.path.length - b.path.length);
      }

      // Keep the first one, select the rest
      for (let i = 1; i < sorted.length; i++) {
        newSelection.add(sorted[i].path);
      }
    });
    setSelection(newSelection);
  };

  const handleDelete = async (permanent: boolean = false) => {
    if (selection.size === 0) return;

    const message = permanent
      ? `¿Estás SEGURO de eliminar PERMANENTEMENTE ${selection.size} archivos? Esta acción NO se puede deshacer.`
      : `¿Mover ${selection.size} archivos a la papelera?`;

    if (!confirm(message)) return;

    let successCount = 0;
    let freedBytes = 0;

    for (const path of selection) {
      try {
        // Find file size for stats
        let size = 0;
        for (const g of results) {
          const f = g.files.find(f => f.path === path);
          if (f) { size = f.size; break; }
        }

        if (permanent) {
          await invoke("delete_file", { path });
        } else {
          await invoke("trash_file", { path });
        }
        successCount++;
        freedBytes += size;
      } catch (e) {
        console.error(e);
      }
    }

    const newResults = results.map(group => ({
      ...group,
      files: group.files.filter(f => !selection.has(f.path))
    })).filter(group => group.files.length > 1);

    setResults(newResults);
    setSelection(new Set());
    setStats({ freed: freedBytes, count: successCount });

    // Re-run auto-select on remaining if needed, or just clear
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="container mx-auto p-6 max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Eliminator Clean Pro
            </h1>
            <p className="text-gray-400 mt-1">Limpieza inteligente y segura de duplicados</p>
          </div>
          {stats && (
            <div className="bg-green-900/30 border border-green-800 px-4 py-2 rounded-lg text-green-300 text-sm">
              <p className="font-bold">¡Limpieza Completada!</p>
              <p>{stats.count} archivos eliminados</p>
              <p>{formatBytes(stats.freed)} liberados</p>
            </div>
          )}
        </header>

        <main className="space-y-6">
          <section>
            <FolderSelector folders={folders} setFolders={setFolders} />
          </section>

          <section className="flex gap-4">
            {!isScanning ? (
              <button
                onClick={handleScan}
                disabled={folders.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Play fill="currentColor" /> Iniciar Escaneo
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <XCircle /> Cancelar Escaneo
              </button>
            )}
          </section>

          {isScanning && progress && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>{progress.phase}</span>
                <span>{progress.total > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : '...'}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-right">{progress.current} / {progress.total}</p>
            </div>
          )}

          {scanError && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg flex items-center gap-3">
              <AlertTriangle />
              <p>{scanError}</p>
            </div>
          )}

          {results.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700 sticky top-4 z-10 shadow-xl backdrop-blur-sm bg-opacity-90">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm hidden sm:inline">Selección:</span>
                  <button onClick={() => autoSelect('newest')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors border border-gray-600">Mantener Recientes</button>
                  <button onClick={() => autoSelect('oldest')} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors border border-gray-600">Mantener Antiguos</button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-300 mr-2">{selection.size} seleccionados</span>
                  <button
                    onClick={() => handleDelete(false)}
                    disabled={selection.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors shadow-md"
                    title="Mover a Papelera"
                  >
                    <Trash2 size={18} /> Papelera
                  </button>
                  <button
                    onClick={() => handleDelete(true)}
                    disabled={selection.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors shadow-md"
                    title="Eliminar Permanentemente"
                  >
                    <Eraser size={18} /> Eliminar
                  </button>
                </div>
              </div>

              <ResultsTable results={results} selection={selection} toggleSelection={toggleSelection} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
