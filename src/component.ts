import { validateType } from '@orioro/typing'

import { ComponentMountError, ComponentUnmountError } from './errors'

import {
  PlainObject,
  ComponentInstance,
  ComponentPropTypes,
  ComponentMountFn,
  CreateComponentSyncInterface,
  CreateComponentInterface,
} from './types'

const _makeCounter = (prefix) => {
  let COUNT = 0

  return () => {
    COUNT = COUNT + 1
    return `${prefix}_${COUNT}`
  }
}

const _prepareUnmount = (
  componentName: string,
  id: string,
  instanceUnmount,
  props: PlainObject
) => {
  return () => {
    return Promise.all(
      Object.keys(props)
        .map((key) => props[key])
        .filter(
          (prop) =>
            typeof prop.componentName === 'string' &&
            typeof prop.unmount === 'function'
        )
        .map((prop) => prop.unmount())
    )
      .then(() => {
        console.log(`Will unmount: ${componentName}#${id}`)

        return typeof instanceUnmount === 'function'
          ? instanceUnmount()
          : undefined
      })
      .catch((err) => {
        throw new ComponentUnmountError(componentName, err)
      })
  }
}

/**
 * @function componentSync
 * @param {String} componentName
 * @param {Function} mount
 * @param {Object} propTypes
 */
export const componentSync = (
  componentName: string,
  propTypes: ComponentPropTypes,
  mount: ComponentMountFn
): CreateComponentSyncInterface => {
  const counter = _makeCounter(componentName)

  const CreateComponentSync = (
    resolvedProps: PlainObject
  ): ComponentInstance => {
    try {
      validateType(propTypes, resolvedProps)

      const instance = mount(resolvedProps) || {}

      const id = instance.id || counter()
      const instanceUnmount = instance.unmount
      const unmount = _prepareUnmount(
        componentName,
        id,
        instanceUnmount,
        resolvedProps
      )

      return {
        ...instance,
        componentName,
        id,
        unmount,
      }
    } catch (err) {
      throw new ComponentMountError(componentName, err)
    }
  }

  return CreateComponentSync
}

/**
 * @function component
 * @param {String} componentName
 * @param {Function} mount
 * @param {Object} propTypes
 */
export const component = (
  componentName: string,
  propTypes: ComponentPropTypes,
  mount: ComponentMountFn
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
        const unmount = _prepareUnmount(
          componentName,
          id,
          instanceUnmount,
          resolvedProps
        )

        return {
          ...instance,
          componentName,
          id,
          unmount,
        }
      })
      .catch((err) => {
        throw new ComponentMountError(componentName, err)
      })
  }

  return CreateComponent
}
