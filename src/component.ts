import { validateType } from '@orioro/typing'

import {
  PlainObject,
  ComponentInstance,
  ComponentPropTypes,
  ComponentMountFn,
  CreateComponentInterface,
} from './types'

const _makeCounter = (prefix) => {
  let COUNT = 0

  return () => {
    COUNT = COUNT + 1
    return `${prefix}_${COUNT}`
  }
}

export const component = (
  componentName: string,
  mount: ComponentMountFn,
  propTypes: ComponentPropTypes
): CreateComponentInterface => {
  const propKeys = Object.keys(propTypes)

  const counter = _makeCounter(componentName)

  const CreateComponent = (props: PlainObject): Promise<ComponentInstance> => {
    return Promise.all(propKeys.map((key) => Promise.resolve(props[key])))
      .then((resolved) =>
        propKeys.reduce(
          (res, key, index) => ({
            ...res,
            [key]: resolved[index],
          }),
          {}
        )
      )
      .then((resolvedProps) => {
        validateType(propTypes, resolvedProps)

        return Promise.all([mount(resolvedProps), resolvedProps])
      })
      .then(([instance = {}, resolvedProps]) => {
        const id = instance.id || counter()
        const instanceUnmount = instance.unmount

        const unmount = () => {
          return Promise.all(
            Object.keys(resolvedProps)
              .map((key) => resolvedProps[key])
              .filter(
                (prop) =>
                  typeof prop.componentName === 'string' &&
                  typeof prop.unmount === 'function'
              )
              .map((prop) => prop.unmount())
          ).then(() => {
            console.log(`Will unmount: ${componentName}#${id}`)

            return typeof instanceUnmount === 'function'
              ? instanceUnmount()
              : undefined
          })
        }

        return {
          ...instance,
          id,
          componentName,
          unmount,
        }
      })
  }

  return CreateComponent
}
