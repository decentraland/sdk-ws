import { upgradeWebSocketResponse } from '@well-known-components/http-server/dist/ws'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { WebSocket } from 'ws'

import crdtWebsocket from '../../logic/crdt'
import { GlobalContext } from "../../types"

export async function websocketHandler(context: IHttpServerComponent.DefaultContext<GlobalContext>) {
  const logger = context.components.logs.getLogger('Websocket Handler')
  return upgradeWebSocketResponse(socket => {
    logger.info('Websocket connected')
    // TODO fix ws types
    const ws = socket as any as WebSocket

    // TODO: scene id logic based on headers/cookies?
    const sceneId = 'scene-id'
    const crdt = crdtWebsocket(ws, sceneId)

    ws.on('error', (error) => {
      logger.error(error)
      ws.close()
    })

    ws.on('message', (data) => {
      logger.info(data.toString())
      crdt.parseMessage(data)
    })

    ws.on('close', () => {
      logger.info('Websocket closed')
      crdt.disconnect()
    })
  })
}

