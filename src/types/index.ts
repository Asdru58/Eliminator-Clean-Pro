export interface FileInfo {
    path: string;
    size: number;
    modified: number;
}

export interface DuplicateGroup {
    hash: string;
    files: FileInfo[];
}

export interface DeletionResult {
    success: boolean;
    error?: string;
}
