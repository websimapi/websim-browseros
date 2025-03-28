// Basic Configuration for BrowserOS

export const config = {
    terminal: {
        prompt: "BOS:/ $ ", // Default terminal prompt
        welcomeMessage: "Welcome to BrowserOS Terminal!\nInspired by TempleOS.\nType 'help' for commands.",
    },
    filesystem: {
        // Initial file system structure can be defined here if needed,
        // but currently handled in filesystem.js constructor
    },
    windowManager: {
        defaultWidth: 400,
        defaultHeight: 300,
        zIndexCounter: 10, // Initial z-index for windows
    }
};

