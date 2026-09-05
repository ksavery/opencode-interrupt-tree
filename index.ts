import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

const defaultEscapeWindowMs = 600

type ChildSession = { id?: string }
type ListChildren = (parameters: { parentID: string }) => Promise<{ data?: ChildSession[] }>
type KeyAfterContext = {
  event: { name?: string; eventType?: string; repeat?: boolean }
  eventType?: string
}
type KeymapWithInterceptor = {
  intercept: (
    phase: "key:after",
    handler: (context: KeyAfterContext) => void,
    options?: { priority?: number },
  ) => () => void
}

const plugin: TuiPluginModule = {
  id: "interrupt-session-tree",
  async tui(api, options) {
    const escapeWindowMs = typeof options?.escapeWindowMs === "number"
      && Number.isFinite(options.escapeWindowMs)
      && options.escapeWindowMs > 0
      ? options.escapeWindowMs
      : defaultEscapeWindowMs
    let running = false
    let escapeCount = 0
    let lastEscapeAt = 0

    const interruptDescendants = async (parentID: string) => {
      if (running) return
      running = true

      try {
        const failed: string[] = []
        const ordered: string[] = []
        const seen = new Set<string>([parentID])
        const listChildren = api.client.session.list as unknown as ListChildren

        const visit = async (ancestorID: string): Promise<void> => {
          let children: ChildSession[]
          try {
            children = (await listChildren({ parentID: ancestorID })).data ?? []
          } catch {
            failed.push(`listing children of ${ancestorID}`)
            return
          }

          for (const child of children) {
            if (!child.id || seen.has(child.id)) continue
            seen.add(child.id)
            await visit(child.id)
            ordered.push(child.id)
          }
        }

        await visit(parentID)

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
            message: `Descendant cancellation finished with ${failed.length} failure${failed.length === 1 ? "" : "s"}.`,
          })
        } else if (ordered.length === 0) {
          api.ui.toast({ variant: "info", message: "No descendant sessions to interrupt." })
        } else {
          api.ui.toast({
            variant: "success",
            message: `Interrupted ${ordered.length} descendant session${ordered.length === 1 ? "" : "s"}.`,
          })
        }
      } finally {
        running = false
      }
    }

    const unregister = (api.keymap as unknown as KeymapWithInterceptor).intercept(
      "key:after",
      (context) => {
        if (context.event.name !== "escape") return
        if (context.event.repeat) return
        if (context.eventType === "release" || context.event.eventType === "release") return
        if (api.ui.dialog.open || api.route.current.name !== "session") return

        const now = Date.now()
        escapeCount = now - lastEscapeAt <= escapeWindowMs ? escapeCount + 1 : 1
        lastEscapeAt = now

        if (escapeCount !== 3) return
        escapeCount = 0
        const parentID = api.route.current.params.sessionID
        queueMicrotask(() => void interruptDescendants(parentID))
      },
      { priority: -10_000 },
    )

    api.lifecycle.onDispose(unregister)
  },
}

export default plugin
