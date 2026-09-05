import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

const command = "plugin.interrupt-session-tree"
const defaultKeybind = "ctrl+escape"

type ChildSession = { id?: string }
type ListChildren = (parameters: { parentID: string }) => Promise<{ data?: ChildSession[] }>

const plugin: TuiPluginModule = {
  id: "interrupt-session-tree",
  async tui(api, options) {
    const keybind = typeof options?.keybind === "string" && options.keybind.length > 0
      ? options.keybind
      : defaultKeybind
    let running = false

    const interruptSessionTree = async () => {
      if (running) return
      if (api.route.current.name !== "session") {
        api.ui.toast({ variant: "info", message: "No session is currently displayed." })
        return
      }

      running = true
      try {
        const currentSessionID = api.route.current.params.sessionID
        const failed: string[] = []
        const ordered: string[] = []
        const seen = new Set<string>([currentSessionID])
        const listChildren = api.client.session.list as unknown as ListChildren

        const visit = async (parentID: string): Promise<void> => {
          let children: ChildSession[]
          try {
            children = (await listChildren({ parentID })).data ?? []
          } catch {
            failed.push(`listing children of ${parentID}`)
            return
          }

          for (const child of children) {
            if (!child.id || seen.has(child.id)) continue
            seen.add(child.id)
            await visit(child.id)
            ordered.push(child.id)
          }
        }

        await visit(currentSessionID)
        ordered.push(currentSessionID)

        for (const sessionID of ordered) {
          try {
            await api.client.session.interrupt({ sessionID })
          } catch {
            failed.push(`interrupting ${sessionID}`)
          }
        }

        if (failed.length > 0) {
          api.ui.toast({
            variant: "warning",
            message: `Session tree interrupted with ${failed.length} failure${failed.length === 1 ? "" : "s"}.`,
          })
        } else {
          api.ui.toast({
            variant: "success",
            message: `Interrupted ${ordered.length} session${ordered.length === 1 ? "" : "s"} in the session tree.`,
          })
        }
      } finally {
        running = false
      }
    }

    api.keymap.registerLayer({
      commands: [
        {
          name: command,
          title: "Interrupt session tree",
          category: "Session",
          run: interruptSessionTree,
        },
      ],
      bindings: [{ key: keybind, cmd: command, desc: "Interrupt session tree", group: "Session" }],
    })
  },
}

export default plugin
