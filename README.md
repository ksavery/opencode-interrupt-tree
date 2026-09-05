# opencode-interrupt-tree

An OpenCode TUI plugin that adds `Ctrl+Escape` to interrupt the displayed
session and every recursive subagent without sending an LLM message.

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
      { "keybind": "ctrl+escape" }
    ]
  ]
}
```

Restart OpenCode after changing its configuration.

## Behavior

When triggered from a session, the plugin finds every descendant session,
interrupts descendants first, then interrupts the displayed session. It uses
OpenCode's native session interrupt API and does not create a chat message or
invoke an LLM.

The configured keybind defaults to `ctrl+escape` and can be changed without
editing the plugin:

```json
{ "keybind": "ctrl+g" }
```

## Limitations

- The terminal must emit `Ctrl+Escape` as a distinct key sequence. If it does
  not, configure another keybind.
- The shortcut interrupts only the displayed session and its descendants, not
  unrelated OpenCode sessions.

## License

[MIT](LICENSE)
