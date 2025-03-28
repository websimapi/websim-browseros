// Simple In-Memory Filesystem

class FileSystem {
    constructor() {
        this.root = {
            type: 'directory',
            name: '/',
            children: {
                'home': {
                    type: 'directory',
                    name: 'home',
                    children: {
                         'user': {
                             type: 'directory',
                             name: 'user',
                             children: {}
                         }
                    }
                },
                 'bin': {
                    type: 'directory',
                    name: 'bin',
                    children: {} // For executables later?
                 },
                 'etc': {
                     type: 'directory',
                     name: 'etc',
                     children: {} // For config files later?
                 }
            }
        };
    }

    // --- Path Manipulation ---

    normalizePath(path) {
        // Basic normalization: remove trailing slashes, resolve '.' and '..' (partially)
        if (path === '/') return '/';
         // Remove trailing slash unless it's the root path
        let normalized = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
        // Simple way to handle multiple slashes, might need more robust solution
        normalized = normalized.replace(/\/+/g, '/');
        // Doesn't handle complex .. cases like /a/b/../c yet. Needs stack-based approach for full POSIX compliance.
        return normalized;
    }

    getParentPath(path) {
        const normPath = this.normalizePath(path);
        if (normPath === '/') return null; // Root has no parent path string
        const lastSlash = normPath.lastIndexOf('/');
        if (lastSlash === 0) return '/'; // Parent is root
        return normPath.substring(0, lastSlash);
    }

    getBaseName(path) {
        const normPath = this.normalizePath(path);
        if (normPath === '/') return '/';
        const lastSlash = normPath.lastIndexOf('/');
        return normPath.substring(lastSlash + 1);
    }


    // --- Core Operations ---

    getEntry(path) {
        const normPath = this.normalizePath(path);
        const parts = normPath.split('/').filter(p => p); // Split and remove empty parts
        let current = this.root;

        if (normPath === '/') return this.root;


        for (const part of parts) {
            if (current.type !== 'directory' || !current.children || !current.children[part]) {
                return null; // Path does not exist or navigates through a file
            }
            current = current.children[part];
        }
        return current;
    }

     _resolveParent(path) {
         const parentPath = this.getParentPath(path);
         if (parentPath === null) return null; // Cannot operate on root this way
         const parent = this.getEntry(parentPath);
         if (!parent || parent.type !== 'directory') {
             return null; // Parent path doesn't exist or isn't a directory
         }
         return parent;
     }

    createFile(path, content = '') {
        const normPath = this.normalizePath(path);
        const baseName = this.getBaseName(normPath);
        if (!baseName || baseName === '/') return false; // Invalid name or trying to replace root

        const parent = this._resolveParent(normPath);
        if (!parent) return false; // Parent directory not found

        if (parent.children[baseName]) {
             // Optionally overwrite? For now, fail if exists.
             console.warn(`File already exists: ${normPath}`);
             // To overwrite: check type, if file, update content. If dir, fail.
              const existing = parent.children[baseName];
              if (existing.type === 'file') {
                  existing.content = content; // Overwrite content
                  return true;
              } else {
                  return false; // Cannot overwrite a directory with a file
              }
        }

        parent.children[baseName] = {
            type: 'file',
            name: baseName,
            content: content
        };
        return true;
    }

    createDir(path) {
         const normPath = this.normalizePath(path);
         const baseName = this.getBaseName(normPath);
         if (!baseName || baseName === '/') return false; // Invalid name or trying to replace root

         const parent = this._resolveParent(normPath);
         if (!parent) return false; // Parent directory not found

         if (parent.children[baseName]) {
              console.warn(`Directory or file already exists: ${normPath}`);
              return false; // Don't overwrite
         }


        parent.children[baseName] = {
            type: 'directory',
            name: baseName,
            children: {}
        };
        return true;
    }

    readFile(path) {
        const entry = this.getEntry(path);
        if (!entry || entry.type !== 'file') {
            return null; // Not a file or doesn't exist
        }
        return entry.content;
    }

    listDir(path) {
        const entry = this.getEntry(path);
        if (!entry || entry.type !== 'directory') {
            return null; // Not a directory or doesn't exist
        }
        // Return an array of {name, type} objects
        return Object.values(entry.children).map(child => ({
            name: child.name,
            type: child.type
        }));
    }

     remove(path) {
         const normPath = this.normalizePath(path);
         const baseName = this.getBaseName(normPath);
         if (!baseName || baseName === '/') return false; // Cannot remove root

         const parent = this._resolveParent(normPath);
         if (!parent) return false; // Parent not found

         const entryToRemove = parent.children[baseName];
         if (!entryToRemove) return false; // Entry doesn't exist

         // Optional: Add check for removing non-empty directories
         if (entryToRemove.type === 'directory' && Object.keys(entryToRemove.children).length > 0) {
             console.warn(`Cannot remove non-empty directory: ${normPath}`);
             return false;
         }


         delete parent.children[baseName];
         return true;
     }


    // TODO: Implement other FS operations like 'mv', 'cp', 'write' etc.
}

// Export a single instance of the filesystem
export const fs = new FileSystem();

