# OMP Full Status Widget

A compact five-row status widget for [Oh My Pi](https://github.com/can1357/oh-my-pi). It sits above the editor and keeps the useful `statusLine.preset: full` runtime data visible when terminal width changes.

## Display

The widget keeps the current OMP theme and groups public runtime data into five rows:

1. Pi, host, model, and thinking level
2. Workspace and Git branch/change counts
3. Session, context use, and cache-hit rate
4. Input/output/cache-read tokens and average token rate
5. Cost, elapsed session time, and clock

Long paths, branch names, model IDs, and session names are abbreviated from the left as needed. At 80 columns the normal layout stays within five rows; narrower terminals preserve content by wrapping rather than dropping fields.

## Install

Requires OMP 18.0.0 or later and Bun, which OMP already uses at runtime.

Clone the repository into a directory of your choice, then register the widget by its absolute path: replace the `/path/to` (or `C:/path/to`) placeholder below with the directory you cloned into.

macOS / Linux (sh):

```sh
git clone https://github.com/Eridanus117/omp-full-status-widget.git
omp config set extensions '["/path/to/omp-full-status-widget/full-status-widget.ts"]'
omp config set statusLine.preset minimal
```

Windows (PowerShell):

```powershell
git clone https://github.com/Eridanus117/omp-full-status-widget.git
omp config set extensions '[\"C:/path/to/omp-full-status-widget/full-status-widget.ts\"]'
omp config set statusLine.preset minimal
```

The backslash-escaped quotes keep the JSON value intact in Windows PowerShell 5.1; on PowerShell 7.3 and later the unescaped sh form also works.

Restart OMP after changing its extension configuration.

If you already use other extensions, include this file in the existing `extensions` array instead of replacing it.

## Verify

From the repository root, run the check script to verify that the widget builds successfully:

```sh
bun run check
```

## Design constraints

OMP's public extension API exposes the theme, model, session metadata, context use, message usage, and editor-adjacent widgets. It does not expose the native status-line renderer or its PR/subagent segments. The widget therefore reuses OMP theme typography and mirrors only the public `full`-status data; it never fabricates unavailable values.

## License

[MIT](LICENSE)
