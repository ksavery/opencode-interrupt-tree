# opencode-interrupt-tree

An OpenCode TUI plugin that uses a third rapid `Escape` press to interrupt
every recursive subagent without sending an LLM message.

## Install

Clone this repository into OpenCode's global plugin directory:

```bash
git clone https://github.com/ksavery/opencode-interrupt-tree.git \
  ~/.config/opencode/plugins/interrupt-session-tree
```

Add the plugin to `~/.config/opencode/tui.json`. Preserve existing entries in
the `plugin` array:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    [
      "./plugins/interrupt-session-tree/index.ts",
      { "escapeWindowMs": 600 }
    ]
  ]
}
```

Restart OpenCode after changing its configuration.

## Behavior

OpenCode keeps its native Escape behavior. Press Escape three times within the
configured time window:

- The first two presses retain OpenCode's normal interruption behavior.
- The third press interrupts every descendant session, deepest-first.

The plugin uses OpenCode's native session interrupt API and does not create a
chat message or invoke an LLM.

`escapeWindowMs` defaults to `600` and can be changed without editing the
plugin:

```json
{ "escapeWindowMs": 800 }
```

## Limitations

- The shortcut interrupts only the displayed session and its descendants, not
  unrelated OpenCode sessions.
- OpenCode's native bottom-left Escape hint is not exposed to plugins.

## License

[MIT](LICENSE)
