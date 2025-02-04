async function createNotesContent() {
    const container = document.createElement("div");
    container.id = "tab-notes";
    
    const textarea = document.createElement("textarea");
    textarea.id = "notes-textarea";
    textarea.style.width = "100%";
    textarea.style.height = "300px";
    textarea.style.padding = "5px";
    textarea.style.backgroundColor = "#1b1b1b";
    textarea.style.color = "#fff";
    textarea.style.border = "1px solid #4d4d4d";
    textarea.style.borderRadius = "5px";
    container.appendChild(textarea);
    
    // Load stored notes
    chrome.storage.local.get(["userNotes"], function(result) {
        if (result.userNotes) {
            textarea.value = result.userNotes;
        }
    });
    
    // Save notes automatically on input
    textarea.addEventListener("input", () => {
        chrome.storage.local.set({ userNotes: textarea.value });
    });
    
    return container;
}

export default function () {
    return {
        name: "Notes",
        icon: "📝",
        createContent: createNotesContent,
        async init() {
            console.log("Notes Plugin Initialized.");
        },
        destroy() {
            console.log("Notes Plugin Destroyed.");
        },
    };
}
