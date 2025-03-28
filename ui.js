// UI Helper Functions

// --- Clock ---
export function updateClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const now = new Date();
        // Simple HH:MM:SS format
        const timeString = now.toLocaleTimeString([], { hour12: false });
        clockElement.textContent = timeString;
    }
}


// --- Menu ---
export function setupMenu() {
    const menuButton = document.getElementById('menu-button');
    const menu = document.getElementById('menu');
    const desktop = document.getElementById('desktop');

    if (!menuButton || !menu) return;

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent desktop click listener from closing immediately
        menu.classList.toggle('hidden');
        // Position menu below button (adjust if needed)
        menu.style.left = menuButton.offsetLeft + 'px';
        menu.style.top = menuButton.offsetTop + menuButton.offsetHeight + 'px';
    });

    // Close menu if clicking outside
     document.addEventListener('click', (event) => {
         if (!menu.classList.contains('hidden') && !menu.contains(event.target)) {
             menu.classList.add('hidden');
         }
     });

     // Add listeners to menu items
     menu.querySelectorAll('button[data-app]').forEach(button => {
         button.addEventListener('click', () => {
             const appName = button.getAttribute('data-app');
             if (window.launchApp) {
                 window.launchApp(appName); // Call global app launcher
             } else {
                 console.error("launchApp function not found on window");
             }
              menu.classList.add('hidden'); // Hide menu after click
         });
     });
}

// --- Other potential UI functions ---
// - Notifications
// - Dialog boxes
// - Taskbar management (listing open windows)

