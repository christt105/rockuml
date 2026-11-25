# RockUML

RockUML is an Obsidian plugin in development for viewing, navigating, and exporting Mermaid and PlantUML diagrams. The planned viewer includes a full-width tab with pan and zoom and SVG and PNG export.

## Install with BRAT

1. Install and enable BRAT from Obsidian's Community plugins.
2. Open BRAT's settings and add `christt105/rockuml` as a beta plugin. For a pull request build, use **Add beta plugin with frozen version** and enter the preview version from the pull request.
3. Enable RockUML in Community plugins.

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
