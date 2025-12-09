import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { FolderSelector } from "./components/FolderSelector";
import { ResultsTable } from "./components/ResultsTable";
import { FilterPanel } from "./components/FilterPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { ActionSidebar } from "./components/ActionSidebar";
import { DuplicateGroup, FileInfo } from "./types";
import { Play, AlertTriangle, XCircle, LayoutGrid, Settings, Sparkles } from "lucide-react";
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

  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['document', 'image', 'video', 'other']));
  const [focusedFile, setFocusedFile] = useState<FileInfo | null>(null);

  useEffect(() => {
    const unlistenScan = listen<ProgressEvent>("scan-progress", (event) => {
      setProgress(event.payload);
    });
    const unlistenOp = listen<ProgressEvent>("operation-progress", (event) => {
      setProgress(event.payload);
    });

    return () => {
      unlistenScan.then((f) => f());
      unlistenOp.then((f) => f());
    };
  }, []);

  const handleScan = async () => {
    if (folders.length === 0) return;
    setIsScanning(true);
    setScanError(null);
    setResults([]);
    setSelection(new Set());
    setStats(null);
    setFocusedFile(null);
    setProgress({ phase: "Iniciando...", current: 0, total: 0 });

    try {
      const data = await invoke<DuplicateGroup[]>("scan_files", { paths: folders });
      setResults(data);
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

  const autoSelect = (strategy: 'newest' | 'oldest', currentResults = results) => {
    const newSelection = new Set<string>();
    currentResults.forEach(group => {
      if (group.files.length < 2) return;
      let sorted = [...group.files];
      if (strategy === 'newest') sorted.sort((a, b) => b.modified - a.modified);
      else if (strategy === 'oldest') sorted.sort((a, b) => a.modified - b.modified);

      for (let i = 1; i < sorted.length; i++) {
        newSelection.add(sorted[i].path);
      }
    });
    setSelection(newSelection);
  };

  const handleSelectAll = () => {
    const newSelection = new Set<string>();
    filteredResults.forEach(group => {
      group.files.forEach(f => newSelection.add(f.path));
    });
    setSelection(newSelection);
  };

  const handleDeselectAll = () => setSelection(new Set());

  const handleDelete = async (permanent: boolean) => {
    if (selection.size === 0) return;
    if (!confirm(permanent ? `¿Eliminar PERMANENTEMENTE ${selection.size} archivos?` : `¿Mover ${selection.size} archivos a la papelera?`)) return;

    setProgress({ phase: permanent ? "Eliminando..." : "Moviendo a papelera...", current: 0, total: selection.size });
    const paths = Array.from(selection);

    try {
      // @ts-ignore - Types might not be updated yet
      const result = await invoke<{ success: boolean; error?: string }>(permanent ? "delete_multiple_files" : "trash_multiple_files", { paths });

      if (result.success) {
        const newResults = results.map(group => ({
          ...group,
          files: group.files.filter(f => !selection.has(f.path))
        })).filter(group => group.files.length > 1);

        setResults(newResults);
        setStats({ freed: selectionSize, count: paths.length }); // Use calculated size
        setSelection(new Set());
        setFocusedFile(null);
      } else {
        setScanError(result.error || "Error durante la operación");
      }
    } catch (e) {
      console.error(e);
      setScanError(String(e));
    } finally {
      setProgress(null);
    }
  };

  const selectionSize = useMemo(() => {
    let size = 0;
    results.forEach(group => {
      group.files.forEach(f => {
        if (selection.has(f.path)) size += f.size;
      });
    });
    return size;
  }, [selection, results]);

  const filteredResults = useMemo(() => {
    if (activeFilters.size === 4) return results;
    return results.map(group => {
      const filteredFiles = group.files.filter(file => {
        const ext = file.path.split('.').pop()?.toLowerCase() || '';
        let type = 'other';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
        else if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) type = 'video';
        else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) type = 'document';
        return activeFilters.has(type);
      });
      return { ...group, files: filteredFiles };
    }).filter(group => group.files.length > 1);
  }, [results, activeFilters]);

  // Modern Glass Layout
  return (
    <div className="h-screen w-screen flex flex-col text-gray-100 overflow-hidden font-sans">

      {/* 1. Header with Glass Effect */}
      <header className="flex-none h-16 glass border-b border-white/10 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200 tracking-tight">
              Eliminator Clean Pro
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Intelligent Cleaner v1.0.1</p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-4">
          {stats && (
            <div className="flex items-center gap-3 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
              <Sparkles size={14} className="text-green-400" />
              <div className="flex flex-col leading-none">
                <span className="text-green-400 text-xs font-bold">Limpieza Exitosa</span>
                <span className="text-green-300/70 text-[10px]">{stats.count} archivos · {formatBytes(stats.freed)}</span>
              </div>
              <button onClick={() => setStats(null)} className="ml-2 text-green-400 hover:text-white transition-colors"><XCircle size={14} /></button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <div className="flex-1 flex overflow-hidden relative z-0">

        {/* Sidebar (Left) */}
        <aside className="w-80 glass border-r border-white/5 flex flex-col z-20 overflow-hidden md:flex">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Configuración</h3>
              <FolderSelector folders={folders} setFolders={setFolders} />
            </section>

            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Filtros</h3>
              <FilterPanel filters={activeFilters} setFilters={setActiveFilters} />
            </section>

            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Acciones</h3>
              <ActionSidebar
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onKeepNewest={() => autoSelect('newest')}
                onKeepOldest={() => autoSelect('oldest')}
                selectionCount={selection.size}
                selectionSize={selectionSize}
                onDelete={handleDelete}
              />
            </section>

          </div>

          {/* Scan Button Area */}
          <div className="p-4 border-t border-white/5 bg-gray-900/40 backdrop-blur-sm">
            {isScanning ? (
              <button
                onClick={handleCancel}
                className="w-full py-3 bg-red-600/80 hover:bg-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 group border border-white/10"
              >
                <XCircle size={18} className="group-hover:rotate-90 transition-transform" />
                Cancelar
              </button>
            ) : (
              <button
                onClick={handleScan}
                disabled={folders.length === 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 group border border-white/10"
              >
                <Play size={18} className="fill-current group-hover:scale-110 transition-transform" />
                Iniciar Escaneo
              </button>
            )}
          </div>
        </aside>

        {/* Results Area (Center) */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-900/30 overflow-hidden relative">
          <div className="h-12 border-b border-white/5 flex items-center px-4 bg-gray-900/20 justify-between">
            <h2 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              Resultados <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-xs">{filteredResults.length} grupos</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {scanError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-center gap-3 backdrop-blur-sm">
                <AlertTriangle /> {scanError}
              </div>
            )}
            <ResultsTable
              results={filteredResults}
              selection={selection}
              toggleSelection={toggleSelection}
              onFocusFile={setFocusedFile}
              focusedFileId={focusedFile?.path}
            />
          </div>

          {/* Progress Overlay */}
          {isScanning && progress && (
            <div className="absolute inset-x-0 bottom-0 py-2 px-4 bg-gray-900/80 backdrop-blur border-t border-white/10 flex flex-col gap-1 z-30">
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>{progress.phase}</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </main>

        {/* Preview Panel (Right) */}
        <aside className="w-96 glass border-l border-white/5 flex flex-col z-20 hidden lg:flex">
          <div className="h-12 border-b border-white/5 flex items-center px-4 bg-gray-900/20">
            <h2 className="text-sm font-medium text-gray-300">Vista Previa</h2>
          </div>
          <div className="flex-1 p-6 flex flex-col overflow-hidden items-center justify-center text-center">
            <PreviewPanel file={focusedFile} />
          </div>
        </aside>

      </div>
    </div>
  );
}

export default App;
