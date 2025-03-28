import { config } from 'config';

let highestZIndex = config.windowManager.zIndexCounter || 10;
const openWindows = new Map(); // Store references to open window elements

// --- Window Creation ---

export function openWindow(title = "Window", content = "", width = config.windowManager.defaultWidth, height = config.windowManager.defaultHeight, id = null) {
    const desktop = document.getElementById('desktop');
    if (!desktop) {
        console.error("Desktop element not found!");
        return null;
    }

    const windowId = id || `window-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;

    const windowElement = document.createElement('div');
    windowElement.id = windowId;
    windowElement.className = 'window draggable resizable'; // Add resizable class
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;
    // Position new windows slightly offset
    const existingWindows = desktop.querySelectorAll('.window').length;
    const offsetX = 20 * (existingWindows % 10);
    const offsetY = 20 * (existingWindows % 10);
    windowElement.style.left = `${50 + offsetX}px`;
    windowElement.style.top = `${50 + offsetY}px`;
    windowElement.style.zIndex = ++highestZIndex;

    windowElement.innerHTML = `
        <div class="title-bar">
            <span class="title">${title}</span>
            <div class="window-controls">
                <button class="minimize" title="Minimize">-</button>
                <button class="maximize" title="Maximize">[]</button>
                <button class="close" title="Close">X</button>
            </div>
        </div>
        <div class="content">
            ${content}
        </div>
    `;

    desktop.appendChild(windowElement);
    openWindows.set(windowId, windowElement);

    // Add focus/z-index handling
    windowElement.addEventListener('mousedown', () => bringToFront(windowElement));

    // Make draggable and add controls
    makeDraggable(windowElement);
    //makeResizable(windowElement); // Enable resizing
    setupWindowControls(windowElement);


    return windowElement;
}

function closeWindow(windowElement) {
    if (windowElement && windowElement.id) {
         openWindows.delete(windowElement.id);
        windowElement.remove();
        // Potentially trigger cleanup for the app associated with the window
    }
}

function minimizeWindow(windowElement) {
    // Basic minimize: Hide the window. Need a way to restore (e.g., taskbar button)
     windowElement.style.display = 'none';
     // TODO: Add representation to taskbar to allow restoring
     console.log(`Window ${windowElement.id} minimized (hidden). Restore functionality needed.`);
}

function maximizeWindow(windowElement) {
     windowElement.classList.toggle('fullscreen');
     // Adjust content size/layout if needed on maximize/restore
     // Disable/enable dragging and resizing when fullscreen
     if (windowElement.classList.contains('fullscreen')) {
         windowElement.style.left = '0';
         windowElement.style.top = '0';
         // Disable resize maybe?
     } else {
          // Restore previous size/position? Needs storing state.
         // Re-enable resize maybe?
     }
     bringToFront(windowElement); // Ensure maximized window is on top
}


function setupWindowControls(windowElement) {
    const closeBtn = windowElement.querySelector('.close');
    const maximizeBtn = windowElement.querySelector('.maximize');
    const minimizeBtn = windowElement.querySelector('.minimize');

    if (closeBtn) closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering window focus
        closeWindow(windowElement);
    });
    if (maximizeBtn) maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        maximizeWindow(windowElement);
    });
    if (minimizeBtn) minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        minimizeWindow(windowElement);
    });
}


function bringToFront(windowElement) {
    if (parseInt(windowElement.style.zIndex) !== highestZIndex) {
        highestZIndex++;
        windowElement.style.zIndex = highestZIndex;
    }
}

// --- Dragging ---

export function makeDraggable(element) {
    const titleBar = element.querySelector('.title-bar');
    if (!titleBar) return; // Only allow dragging by title bar

    let isDragging = false;
    let offsetX, offsetY;

    titleBar.addEventListener('mousedown', (e) => {
        // Prevent dragging if clicking on buttons
        if (e.target.tagName === 'BUTTON') return;

        isDragging = true;
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
        element.style.cursor = 'grabbing'; // Use grabbing cursor
        titleBar.style.cursor = 'grabbing';
        bringToFront(element); // Bring window to front on drag start
        // Disable text selection during drag
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Prevent dragging if fullscreen
        if (element.classList.contains('fullscreen')) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        // Basic boundary detection (within desktop)
        const desktop = document.getElementById('desktop');
        const taskbar = document.getElementById('taskbar');
        const desktopRect = desktop.getBoundingClientRect();
        const taskbarHeight = taskbar ? taskbar.offsetHeight : 0;
        const titleBarHeight = titleBar.offsetHeight;

         // Prevent dragging title bar completely off screen top/left
         newX = Math.max(0 - element.offsetWidth + titleBarHeight * 2 , newX); // Allow some overlap left
         newY = Math.max(0, newY); // Don't allow going above taskbar/desktop top
         // Prevent dragging completely off screen bottom/right (based on title bar visibility)
         newX = Math.min(desktopRect.width - titleBarHeight*2, newX); // Allow some overlap right
         newY = Math.min(desktopRect.height - titleBarHeight, newY);


        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = ''; // Reset cursor
            titleBar.style.cursor = 'move';
             // Re-enable text selection
             document.body.style.userSelect = '';
        }
    });

     // Set initial cursor for title bar
     titleBar.style.cursor = 'move';
}

// --- Resizing (Basic) ---
// Note: CSS resize: both; is simpler but less controlled.
// This JS approach allows for custom handles if needed later.
export function makeResizable(element) {
     // CSS 'resize: both;' already added to .resizable class.
     // Ensure overflow: hidden is also set on the element in CSS.
     // JS resizing logic can be added here for more complex needs
     // (e.g., custom resize handles, aspect ratio constraints).
     // For now, rely on CSS resizing.
     // Add bringToFront on resize start if needed
     element.addEventListener('mousedown', (e) => {
         // Simple check if resize handle is being grabbed (bottom-right corner)
         const rect = element.getBoundingClientRect();
         const handleSize = 15; // Approximate size of the resize handle area
         const isResizing = e.clientX > rect.right - handleSize && e.clientY > rect.bottom - handleSize;

         if (isResizing) {
             bringToFront(element);
         }
     });

     // Optional: Adjust content layout during/after resize via ResizeObserver
      const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
              // console.log('Element resized:', entry.target);
              // Add logic here if content needs recalculation on resize
              // e.g., recalculate layout, redraw canvas, etc.
          }
      });
      resizeObserver.observe(element);

}

// --- Initialization ---

export function initializeWindowManager() {
    // Currently initialization happens implicitly when windows are created.
    // This function could be used for setting up desktop-wide listeners
    // or managing existing windows if the HTML was pre-populated.
    console.log("Window Manager Initialized.");

     // Add focus to newly created windows? (Maybe done in openWindow)
     // Setup listeners for clicking desktop to potentially de-focus windows?
}

