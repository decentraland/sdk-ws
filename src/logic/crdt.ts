import { RawData, WebSocket } from 'ws'
import { CRDT, crdtProtocol, Message } from '@dcl/crdt'
type SceneData = {
  crdt: CRDT<Uint8Array>
  sockets: Set<WebSocket>
}

const voidFn = async () => {}
const data = new Map<string, SceneData>()

export default function crdtWebsocket(ws: WebSocket, sceneId: string) {
  const { crdt, sockets } = getSceneData()

  function getSceneData() {
    const sceneData = data.get(sceneId)
    if (sceneData) {
      return sceneData
    }
    const defaultSceneData: SceneData = {
      sockets: new Set(),
      crdt: crdtProtocol<Uint8Array>(voidFn, sceneId)
    }
    data.set(sceneId, defaultSceneData)
    return data.get(sceneId)!
  }

  function getState(): Message<Uint8Array>[] {
    const state = crdt.getState()
    return Object.keys(state).map((key) => ({
      key,
      timestamp: state[key]?.timestamp!,
      data: state[key]?.data!
    }))
  }

  function onConnect() {
    sockets.add(ws)
    return ws.send(JSON.stringify(getState()))
  }

  function disconnect() {
    return sockets.delete(ws)
  }

  function parseMessage(rawData: RawData) {
    const msg = JSON.parse(rawData.toString())
    const message = {
      ...msg,
      data: new Uint8Array(Object.values(msg.data))
    }

    if (!message.key || !message.data || !message.timestamp) {
      return
    }

    void data.get(sceneId)?.crdt.processMessage(message)
    broadcast(rawData)
  }

  function broadcast(message: RawData) {
    if (!sockets.size) return

    for (const socket of sockets) {
      if (socket !== ws) {
        socket.send(message.toString())
      }
    }
  }

  // Run onConnect when we call the fn
  onConnect()

  return {
    parseMessage,
    disconnect,
  }
}
