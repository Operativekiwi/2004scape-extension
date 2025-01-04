# 2004scape Extension

## Download the Latest Version

To download the latest version of the extension, click the link below and click *extension.zip*:

[Download Latest Version](https://github.com/Operativekiwi/2004scape-extension/releases/latest)

### Installation Instructions

1. **Unzip the file** you just downloaded.
2. Open Chrome (or another Chromium-based browser) and go to `chrome://extensions/`.
3. **Enable Developer Mode** in the top-right corner.
4. Click the **Load unpacked** button and select the unzipped extension folder.
5. The extension should now appear in your browser and will display when on any 2004scape client, e.g., [https://2004scape.org/client?world=1&detail=high&method=0](https://2004scape.org/client?world=1&detail=high&method=0).

### Notes

- This extension is frequently updated. Check the [Releases Page](https://github.com/Operativekiwi/2004scape-extension/releases) for new updates.
- For issues or feedback, open an [issue](https://github.com/Operativekiwi/2004scape-extension/issues) in the repository.

---

## How to Create and Add Your Own Plugins

To create and add your own plugins to the 2004scape extension, follow the steps below:

1. **Create a Plugin File**: Write a `.js` file for your plugin. It must export an object with certain properties such as `name`, `icon`, `createContent`, and `init`.
   
2. **Add Your Plugin to the Extension**: Place your plugin file in the `plugins` folder of the extension directory.

3. **Update the plugins.json**: Edit plugins.json to include the new plugin.

4. **Reload the Extension**: After saving your plugin, reload the extension by going to `chrome://extensions/` and clicking **Reload** for the 2004scape extension.

Now, when you open the 2004scape client, your new plugin will appear in the tab bar.

### Troubleshooting

- Ensure your plugin exports the correct structure (name, icon, createContent, init).
- If the plugin doesn't show up, make sure the `pluginManager` is correctly loading the `.js` files from the `plugins` folder.
- For issues, check the console for errors (right-click on the page > Inspect > Console).

---

For a complete example of how to structure a plugin, please see the separate `exampleScript.js` file.
