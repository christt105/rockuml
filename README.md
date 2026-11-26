# RockUML

RockUML is an Obsidian plugin in development for viewing, navigating, and exporting Mermaid and PlantUML diagrams. The Mermaid viewer uses Obsidian’s built-in renderer.

## Install with BRAT

1. Install and enable BRAT from Obsidian's Community plugins.
2. Open BRAT's settings and add `christt105/rockuml` as a beta plugin. For a pull request build, use **Add beta plugin with frozen version** and enter the preview version from the pull request.
3. Enable RockUML in Community plugins.

## View and export diagrams

Hover over a rendered Mermaid or PlantUML block, or tab to its toolbar. On touch devices the toolbar is always visible. Use it to open the diagram in a full-width tab, download SVG or PNG, or copy the diagram source. The same controls are available in note embeds.

In the viewer, drag to pan and scroll to zoom around the pointer. The controls fit the diagram to the window, return it to actual size, or zoom in and out. PNG exports are available at 2×, 4×, and 8×. They use SVG text, so HTML formatting in labels can look different from the note.

In RockUML settings, choose **Export theme** and **Export background** for SVG and PNG. The defaults are **As in the note** and **Solid**, which uses the note background color. Choose **Light** with **Solid** for a white background and the light Mermaid palette. **Light** and **Dark** override the Mermaid theme set in the diagram's frontmatter or init directives. Custom styles and theme variables in the diagram still apply.

To opt a note out of **Readable line length**, add this frontmatter property.

```yaml
cssclasses:
  - rockuml-wide
```

## Render PlantUML

Set **PlantUML server URL** in RockUML settings to the base address of your server, including its path if it has one. For example, use `http://localhost:8080/plantuml` for a local server mounted under `/plantuml`. Reopen the note after changing the URL.

Put your diagram in a fenced `plantuml` block. The block displays syntax errors returned by the server. For PlantUML exports, **Export theme** selects the background color when **Export background** is **Solid**. Diagram colors come from the PlantUML render.

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

The SVG regression test runs in Chrome or Chromium. Set `CHROME_BIN` if your executable is outside the standard Linux paths.

## Network use

RockUML sends PlantUML diagram source to the server you configure to generate SVG. It sends plain text to the `/svg` endpoint with POST and uses GET with the compressed source in the URL when the server does not support POST. The server can read the diagram source in either case. The URL is blank by default, so RockUML makes no requests until you configure a server and render a PlantUML block. Mermaid renders locally in Obsidian.

## License

MIT
