function createPersistentIRCFrame() {
  if (!document.getElementById('persistent-irc-frame')) {
      const fixedIframe = document.createElement("iframe");
      fixedIframe.id = 'persistent-irc-frame';
      fixedIframe.src = "https://web.libera.chat/#2004scape?uio=mt,d4"; // Use Kiwi IRC URL params to hide elements
      fixedIframe.style.position = "fixed";
      fixedIframe.style.width = "60%";
      fixedIframe.style.height = "150px"; // Reduced height to prevent collision
      fixedIframe.style.bottom = "0px"; // Anchored fully to the bottom
      fixedIframe.style.left = "20%";
      fixedIframe.style.zIndex = "1000";
      fixedIframe.style.border = "none";
      fixedIframe.style.background = "transparent";
      fixedIframe.style.overflow = "hidden";
      fixedIframe.style.paddingTop = "10px"; // Added top padding to prevent collision
      
      // Find the game's iframe and insert IRC below it
      const gameIframe = document.querySelector("iframe");
      if (gameIframe && gameIframe.parentNode) {
          gameIframe.parentNode.insertBefore(fixedIframe, gameIframe.nextSibling);
      } else {
          document.body.appendChild(fixedIframe);
      }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
      const ircButton = document.querySelector('button[title="IRC Chat"]');
      if (ircButton) {
          ircButton.style.display = "none";
      }
  }, 500); // Delay to ensure button exists before attempting to hide
});

export default function () {
  return {
      name: "IRC Chat",
      icon: "💬",
      hidden: true, // Prevents it from appearing in the plugin list
      async init() {
          console.log("IRC Chat Plugin Initialized.");
          createPersistentIRCFrame();
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
