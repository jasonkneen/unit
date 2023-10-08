import { NOOP } from '../NOOP'
import { Component } from '../client/component'
import { System } from '../system'
import { Callback } from '../types/Callback'
import { Unlisten } from '../types/Unlisten'

export function getGlobalComponent(system: System, id: string): Component {
  const {
    global: { component: _component },
  } = system

  const component = _component[id]

  return component
}

export function listenGlobalComponent(
  system: System,
  id: string,
  callback: Callback<Component>
): Unlisten {
  const { emitter } = system

  const listener = (component: Component) => {
    callback(component)
  }

  emitter.addListener(id, listener)

  return () => {
    emitter.removeListener(id, listener)
  }
}

export function awaitGlobalComponent(
  system: System,
  id: string,
  callback: Callback<Component>
): Unlisten {
  const { emitter } = system

  const component = getGlobalComponent(system, id)

  if (component) {
    callback(component)

    return NOOP
  }

  const listener = (component: Component) => {
    callback(component)
  }

  emitter.addListener(id, listener)

  const unlisten = () => {
    emitter.removeListener(id, listener)
  }

  return unlisten
}
