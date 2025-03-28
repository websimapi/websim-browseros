import { initializeTerminal } from 'terminal';
import { makeDraggable, makeResizable, initializeWindowManager, openWindow } from 'windowmanager';
import { updateClock, setupMenu } from './ui.js';
import { fs } from 'filesystem';

document.addEventListener('DOMContentLoaded', () => {
    console.log("BrowserOS Initializing...");

    // Initialize core components
    initializeWindowManager();
    initializeTerminal();
    updateClock(); // Initial clock update
    setInterval(updateClock, 1000); // Update clock every second
    setupMenu(); // Setup menu button functionality


    // Make initial terminal window draggable and resizable
    const terminalWindow = document.getElementById('terminal-container');
    if (terminalWindow) {
        makeDraggable(terminalWindow);
       // makeResizable(terminalWindow); // Resizable elements often interfere with dragging title bar
        // Add window controls listeners
         const closeBtn = terminalWindow.querySelector('.close');
         const maximizeBtn = terminalWindow.querySelector('.maximize');
         const minimizeBtn = terminalWindow.querySelector('.minimize'); // Assuming minimize exists

         if (closeBtn) closeBtn.addEventListener('click', () => terminalWindow.style.display = 'none');
         if (maximizeBtn) maximizeBtn.addEventListener('click', () => {
             terminalWindow.classList.toggle('fullscreen');
             // Adjust terminal output/input size if needed on maximize/restore
         });
         // Add minimize functionality if desired
    } else {
        console.error("Terminal container not found.");
    }


    // Example: Create a dummy file
    fs.createFile('/home/user/welcome.txt', 'Welcome to BrowserOS!\nThis is a text file.\nInspired by TempleOS.');
    fs.createDir('/home/docs');
    fs.createFile('/home/docs/readme.txt', 'This is the docs directory.');


    console.log("BrowserOS Ready.");
});

// Basic App Launcher (can be expanded)
window.launchApp = function(appName) {
    console.log(`Launching ${appName}...`);
    switch(appName) {
        case 'editor':
            openWindow('Text Editor', '<textarea style="width: 100%; height: 100%; border: none; resize: none; font-family: monospace;"></textarea>');
            break;
        case 'file-explorer':
             const explorerContent = `<div id="file-explorer-content" style="padding: 5px; height: calc(100% - 10px); overflow-y: auto;">Loading...</div>`;
             const explorerWindow = openWindow('File Explorer', explorerContent, 400, 300);
             const contentElement = explorerWindow.querySelector('#file-explorer-content');
             renderFileSystem(contentElement, '/'); // Start at root
            break;
        case 'about':
            openWindow('About BrowserOS', `<div style="padding: 10px;">
                <h2>BrowserOS</h2>
                <p>A simple web-based OS interface inspired by TempleOS.</p>
                <p>Created with HTML, CSS, and JavaScript.</p>
                </div>`, 300, 150);
            break;
        default:
            console.warn(`Unknown app: ${appName}`);
    }
     // Hide menu after launching app
     const menu = document.getElementById('menu');
     if (menu) menu.classList.add('hidden');
}

function renderFileSystem(container, path) {
    const entries = fs.listDir(path);
    if (!entries) {
        container.innerHTML = `<p>Error listing directory: ${path}</p>`;
        return;
    }

    let html = `<strong>Contents of ${path}</strong><ul>`;
    if (path !== '/') {
         const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
         html += `<li><a href="#" data-path="${parentPath}">.. (Up)</a></li>`;
    }

    entries.sort((a, b) => {
        // Sort directories first, then files, alphabetically
        const aIsDir = a.type === 'directory';
        const bIsDir = b.type === 'directory';
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.name.localeCompare(b.name);
    });

    entries.forEach(entry => {
        const fullPath = (path === '/' ? '' : path) + '/' + entry.name;
        const icon = entry.type === 'directory' ? '&#128193;' : '&#128196;'; // Folder and file icons
         html += `<li>${icon} <a href="#" data-path="${fullPath}" data-type="${entry.type}">${entry.name}</a></li>`;
    });
    html += `</ul>`;
    container.innerHTML = html;

    // Add click listeners for navigation/opening files
    container.querySelectorAll('a[data-path]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPath = link.getAttribute('data-path');
            const targetType = link.getAttribute('data-type');
             if (targetType === 'directory' || link.textContent === '.. (Up)') {
                 renderFileSystem(container, targetPath);
             } else if (targetType === 'file') {
                 // Basic file viewer (opens in editor for now)
                 const content = fs.readFile(targetPath);
                 const editorWindow = openWindow(`View: ${targetPath}`, '<textarea style="width: 100%; height: 100%; border: none; resize: none; font-family: monospace;" readonly></textarea>');
                 editorWindow.querySelector('textarea').value = content || `Error reading file: ${targetPath}`;

             }
        });
    });
}

