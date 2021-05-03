import { TypeSpec } from '@orioro/typing'

export type PlainObject = {
  [key: string]: any
}

export type ComponentInstance = {
  componentName: string
  id: string
  unmount: (() => void) | (() => Promise<void>)
  [key: string]: any
}

export type ComponentPropTypes = {
  [key: string]: TypeSpec
}

export type ComponentMountFn =
  | ((props: PlainObject) => PlainObject | void)
  | ((props: PlainObject) => Promise<PlainObject | void>)

export type CreateComponentInterface = (
  props: PlainObject
) => Promise<ComponentInstance>
