# RockUML

RockUML is an Obsidian plugin in development for viewing, navigating, and exporting Mermaid and PlantUML diagrams. The Mermaid viewer uses Obsidian’s built-in renderer.

## Install with BRAT

1. Install and enable BRAT from Obsidian's Community plugins.
2. Open BRAT's settings and add `christt105/rockuml` as a beta plugin. For a pull request build, use **Add beta plugin with frozen version** and enter the preview version from the pull request.
3. Enable RockUML in Community plugins.

## View and export Mermaid

Hover over a rendered Mermaid block or tab to its toolbar. On touch devices the toolbar is always visible. Use it to open the diagram in a full-width tab, download SVG or PNG, or copy the Mermaid source. The same controls are available in note embeds.

In the viewer, drag to pan and scroll to zoom around the pointer. The controls fit the diagram to the window, return it to actual size, or zoom in and out. PNG exports are available at 2×, 4×, and 8×. They use SVG text, so HTML formatting in labels can look different from the note.

In RockUML settings, choose **Export theme** and **Export background** for SVG and PNG. The defaults are **As in the note** and **Solid**, which uses the note background color. Choose **Light** with **Solid** for a white background and the light Mermaid palette. **Light** and **Dark** override the Mermaid theme set in the diagram's frontmatter or init directives. Custom styles and theme variables in the diagram still apply.

To opt a note out of **Readable line length**, add this frontmatter property.

```yaml
cssclasses:
  - rockuml-wide
```

## Development

Use Node.js 24.

```sh
npm ci
npm run dev       # Watch and rebuild main.js
npm run build     # Type-check and build for production
npm run lint
npm run typecheck
npm test
```

## Network use

The current version makes no network requests. When PlantUML support is added, it will send diagram requests only to the server URL configured by the user. The URL will be empty by default, and the plugin will never use plantuml.com as a default or fallback.

## License

MIT
