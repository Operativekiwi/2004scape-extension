export default function () {
    return {
      name: "Market Plugin", // The name of your plugin
      icon: "✨", // Optional icon to display in the UI
      createContent: () => {
        const content = document.createElement("div");
        content.innerHTML = "<h3>Welcome to Example Plugin!</h3>";
        return content;
      },
      async init() {
        console.log("Example Plugin Initialized.");
      },
      destroy() {
        console.log("Example Plugin Destroyed.");
      }
    };
  }
  