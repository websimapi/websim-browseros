import { config } from 'config';
import { fs } from './filesystem.js'; // Import the filesystem instance

let currentDir = '/'; // Start at root directory
const commandHistory = [];
let historyIndex = -1;

const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const promptElement = document.getElementById('prompt');

function output(message, isHtml = false) {
    if (!terminalOutput) return;
    const line = document.createElement('div');
    if (isHtml) {
        line.innerHTML = message;
    } else {
        line.textContent = message;
    }
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight; // Auto-scroll
}

function updatePrompt() {
     const user = "user"; // Placeholder for user concept
     const hostname = "browseros"; // Placeholder hostname
     promptElement.textContent = `${user}@${hostname}:${currentDir}$ `;
     // Adjust input line positioning if needed
     terminalOutput.scrollTop = terminalOutput.scrollHeight;
}


function processCommand(command) {
    output(promptElement.textContent + command); // Echo command
    commandHistory.push(command);
    historyIndex = commandHistory.length; // Reset history index

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case 'help':
            output("Available commands:");
            output("  help          - Show this help message");
            output("  clear         - Clear the terminal screen");
            output("  echo [text]   - Print text to the terminal");
            output("  date          - Display the current date and time");
            output("  ls [path]     - List directory contents");
            output("  cd [path]     - Change current directory");
            output("  pwd           - Print working directory");
            output("  mkdir [name]  - Create a new directory");
            output("  touch [name]  - Create an empty file");
            output("  cat [path]    - Display file content");
            output("  rm [path]     - Remove a file or empty directory");
            // Add more commands here
            break;
        case 'clear':
            terminalOutput.innerHTML = '';
            break;
        case 'echo':
            output(args.join(' '));
            break;
        case 'date':
            output(new Date().toString());
            break;
         case 'ls': {
            const pathToList = args[0] ? resolvePath(args[0]) : currentDir;
            const entries = fs.listDir(pathToList);
            if (entries) {
                if (entries.length === 0) {
                    output(`Directory is empty: ${pathToList}`);
                } else {
                    let listOutput = '';
                    entries.forEach(entry => {
                        listOutput += `${entry.type === 'directory' ? 'd' : '-'} ${entry.name}\n`;
                    });
                     output(listOutput.trim()); // Use pre-wrap or handle formatting
                }
            } else {
                output(`ls: cannot access '${args[0] || pathToList}': No such file or directory`);
            }
            break;
        }
         case 'cd': {
            if (!args[0]) {
                // cd with no arguments could go to home, but we'll require a path for now
                 output("cd: missing operand");
                 break;
            }
            const targetPath = resolvePath(args[0]);
            const entry = fs.getEntry(targetPath);

            if (entry && entry.type === 'directory') {
                currentDir = targetPath;
            } else if (targetPath === '..') { // Handle '..' explicitly if resolvePath doesn't fully cover it
                 const parentPath = currentDir.substring(0, currentDir.lastIndexOf('/')) || '/';
                 currentDir = parentPath;
            }
             else {
                 output(`cd: no such file or directory: ${args[0]}`);
            }
            break;
        }
        case 'pwd':
             output(currentDir);
             break;
         case 'mkdir': {
            if (!args[0]) {
                 output("mkdir: missing operand");
                 break;
            }
            const newDirPath = resolvePath(args[0]);
            const success = fs.createDir(newDirPath);
            if (!success) {
                 output(`mkdir: cannot create directory '${args[0]}': File exists or invalid path`);
            }
            break;
        }
         case 'touch': {
            if (!args[0]) {
                 output("touch: missing operand");
                 break;
            }
            const newFilePath = resolvePath(args[0]);
            const success = fs.createFile(newFilePath, '');
            if (!success) {
                 output(`touch: cannot create file '${args[0]}': File exists or invalid path`);
            }
            break;
        }
        case 'cat': {
            if (!args[0]) {
                output("cat: missing operand");
                break;
            }
            const filePath = resolvePath(args[0]);
            const content = fs.readFile(filePath);
            if (content !== null) {
                // Output line by line to preserve formatting better in simple divs
                content.split('\n').forEach(line => output(line));
            } else {
                 output(`cat: ${args[0]}: No such file or directory`);
            }
            break;
        }
        case 'rm': {
             if (!args[0]) {
                 output("rm: missing operand");
                 break;
             }
             const pathToRemove = resolvePath(args[0]);
             const success = fs.remove(pathToRemove);
             if (!success) {
                 output(`rm: cannot remove '${args[0]}': No such file or directory, or directory not empty`);
             }
             break;
         }

        default:
            if (cmd) { // Avoid error on empty input
                output(`Command not found: ${cmd}`);
            }
    }
     updatePrompt(); // Update prompt after command execution
}


// Helper to resolve paths (handles relative and absolute)
function resolvePath(path) {
    if (path.startsWith('/')) {
        return fs.normalizePath(path); // Already absolute
    }
    if (path === '..') {
        // Go up one level
        const lastSlash = currentDir.lastIndexOf('/');
        if (lastSlash > 0) { // Not already at root
            return currentDir.substring(0, lastSlash);
        } else {
            return '/'; // Already at root or just below root
        }
    }
     // Relative path: append to current directory
     const newPath = (currentDir === '/' ? '' : currentDir) + '/' + path;
     return fs.normalizePath(newPath);
}

export function initializeTerminal() {
    if (!terminalInput || !terminalOutput || !promptElement) {
        console.error("Terminal elements not found!");
        return;
    }

    output(config.terminal.welcomeMessage);
    updatePrompt(); // Set initial prompt

    terminalInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const command = terminalInput.value.trim();
            if (command) {
                processCommand(command);
            } else {
                 // If empty command entered, just echo the prompt again on a new line
                 output(promptElement.textContent);
                 updatePrompt(); // Ensure prompt is ready for next input
            }
            terminalInput.value = '';
        } else if (event.key === 'ArrowUp') {
            // History up
             if (commandHistory.length > 0 && historyIndex > 0) {
                 historyIndex--;
                 terminalInput.value = commandHistory[historyIndex];
                 event.preventDefault(); // Prevent cursor move
             }
         } else if (event.key === 'ArrowDown') {
             // History down
             if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                 historyIndex++;
                 terminalInput.value = commandHistory[historyIndex];
                 event.preventDefault(); // Prevent cursor move
             } else if (historyIndex === commandHistory.length - 1) {
                 // Reached end of history, clear input
                 historyIndex++;
                 terminalInput.value = '';
             }
         } else if (event.key === 'Tab') {
             // Basic Tab Completion (Example: complete filenames in current dir)
             event.preventDefault();
             const currentInput = terminalInput.value;
             const lastSpaceIndex = currentInput.lastIndexOf(' ');
             const prefix = currentInput.substring(lastSpaceIndex + 1);

             if (prefix) { // Only complete if there's something to complete
                 const entries = fs.listDir(currentDir);
                 const matches = entries.filter(e => e.name.startsWith(prefix));

                 if (matches.length === 1) {
                     // Complete single match
                     const completedName = matches[0].name + (matches[0].type === 'directory' ? '/' : '');
                     terminalInput.value = currentInput.substring(0, lastSpaceIndex + 1) + completedName;
                 } else if (matches.length > 1) {
                     // Show multiple matches
                     output(promptElement.textContent + currentInput); // Echo current input
                     output(matches.map(m => m.name).join('  ')); // List matches
                     updatePrompt(); // Show prompt again
                 }
             }
        }
    });

    // Focus input when clicking anywhere in the terminal content area (excluding title bar)
    const terminalContent = document.querySelector('#terminal-container .content');
    if (terminalContent) {
        terminalContent.addEventListener('click', (event) => {
            // Avoid focusing if clicking on output text for selection
            if (event.target === terminalContent || event.target === terminalOutput || event.target.id === 'terminal-input-line' || event.target.id === 'prompt') {
                 terminalInput.focus();
            }
        });
    }

     // Initial focus
     terminalInput.focus();
}

