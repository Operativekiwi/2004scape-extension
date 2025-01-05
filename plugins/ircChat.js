// ircChat.js

function createIRCContent() {
    const container = document.createElement("div");
    container.id = "tab-irc-chat";
  
    const title = document.createElement("h3");
    title.textContent = "IRC Chat";
    container.appendChild(title);
  
    // Create iframe for Libera Chat webchat
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "450px"; // Adjusted to fit extension window better
    iframe.style.border = "1px solid #333";
    iframe.style.borderRadius = "4px";
    iframe.style.backgroundColor = "#1a1a1a";
    
    // Set source to Libera Chat's webchat with #2004scape channel
    iframe.src = "https://web.libera.chat/#2004scape";
    
    container.appendChild(iframe);
  
    // Add compact instructions
    const instructions = document.createElement("div");
    instructions.style.marginTop = "10px";
    instructions.style.padding = "8px";
    instructions.style.backgroundColor = "#2a2a2a";
    instructions.style.borderRadius = "4px";
    instructions.style.fontSize = "12px";
    instructions.innerHTML = `
      <strong>Quick Commands:</strong>
      <div style="display: flex; justify-content: space-between; margin-top: 5px;">
        <span>/nick newname</span>
        <span>/join #channel</span>
        <span>/msg user text</span>
      </div>
    `;
    container.appendChild(instructions);
  
    return container;
  }
  
  export default function () {
    return {
      name: "IRC Chat",
      icon: "💬",
      createContent: createIRCContent,
      async init() {
        console.log("IRC Chat Plugin Initialized.");
      },
      destroy() {
        console.log("IRC Chat Plugin Destroyed.");
      }
    };
  }