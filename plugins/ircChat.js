let isIRCTabActive = false;

function createIRCContent() {
  const container = document.createElement("div");
  container.id = "tab-irc-chat";

  const title = document.createElement("h3");
  title.textContent = "IRC Chat";
  container.appendChild(title);


  const placeholder = document.createElement("div");
  placeholder.style.height = "450px";
  container.appendChild(placeholder);

  if (!document.getElementById('persistent-irc-frame')) {
    const fixedIframe = document.createElement("iframe");
    fixedIframe.id = 'persistent-irc-frame';
    fixedIframe.src = "https://web.libera.chat/#2004scape";
    fixedIframe.style.position = "absolute";
    fixedIframe.style.width = "180px";
    fixedIframe.style.height = "450px";
    fixedIframe.style.border = "1px solid #333";
    fixedIframe.style.borderRadius = "4px";
    fixedIframe.style.backgroundColor = "#1a1a1a";
    fixedIframe.style.top = "70px";
    fixedIframe.style.right = "20px";
    fixedIframe.style.display = "none";
    fixedIframe.style.zIndex = "10000";
    const sidebar = document.getElementById("vertical-tabs-container");
    if (sidebar) {
        sidebar.appendChild(fixedIframe);
    } else {
        document.body.appendChild(fixedIframe);
    }
    
  }

  const iframe = document.getElementById('persistent-irc-frame');
  if (iframe) {
    isIRCTabActive = true;
    iframe.style.display = "block";
  }

  return container;
}

function hideIRCFrame() {
  const iframe = document.getElementById('persistent-irc-frame');
  if (iframe && isIRCTabActive) {
    iframe.style.display = "none";
    isIRCTabActive = false;
  }
}

// Add event listener to hide iframe when switching tabs
document.addEventListener('click', (e) => {
  // Check if click is on a different tab button
  if (e.target.closest('button') && !e.target.title?.includes('IRC Chat')) {
    hideIRCFrame();
  }
});

export default function () {
  return {
    name: "IRC Chat",
    icon: "💬",
    createContent: createIRCContent,
    async init() {
      console.log("IRC Chat Plugin Initialized.");
    },
    destroy() {
      const iframe = document.getElementById('persistent-irc-frame');
      if (iframe) {
        iframe.remove();
      }
      console.log("IRC Chat Plugin Destroyed.");
    }
  };
}