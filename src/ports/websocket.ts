import { WebSocketServer, WebSocket } from "ws"

import { BaseComponents, WebSocketComponent } from "../types"
/**
 * Creates a http-server component
 * @public
 */

export async function createWsComponent(
  components: Pick<BaseComponents, 'logs'>
): Promise<WebSocketComponent> {
  const { logs } = components
  const logger = logs.getLogger("ws")

  let wsServer: WebSocketServer | undefined

  async function start () {
    if (wsServer) return
    logger.info('Websocket server started')
    wsServer = new WebSocketServer({ noServer: true })

    wsServer.on('error', (error) => {
      logger.error(error)
    })
  }

  async function stop() {
    wsServer?.close()
    wsServer = undefined
  }

  start()

  return {
    start,
    stop,
    wsServer: wsServer!,
  }
}
