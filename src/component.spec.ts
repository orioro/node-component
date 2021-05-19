import { objectType } from '@orioro/typing'
import { component, componentSync } from './component'
import { ComponentMountError } from './errors'

import { testCases, asyncResult } from '@orioro/jest-util'

const wait = (ms, result) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(result), ms)
  })

describe('component(componentName, mount, propTypes)', () => {
  describe('component type validation', () => {
    const ComponentA = component(
      'ComponentA',
      {
        opt1: 'string',
        opt2: 'number',
      },
      ({ opt1, opt2 }) => ({
        id: `id-${opt1}`,
        someOtherConfig: opt2,
        methodA: () => `methodA-${opt1}`,
      })
    )

    const ComponentB = component(
      'ComponentB',
      {
        opt1: 'string',
        aInstance: objectType(
          {
            methodA: 'function',
          },
          {
            unknownProperties: true,
          }
        ),
      },
      ({ opt1, aInstance }) => ({
        id: `id-${opt1}`,
        methodB: () => `${aInstance.methodA()}__methodB-${opt1}`,
      })
    )

    testCases(
      [
        [
          { opt1: 'value-a', opt2: 10 },
          (result) =>
            expect(result).resolves.toMatchObject({
              componentName: 'ComponentA',
              id: 'id-value-a',
              someOtherConfig: 10,
            }),
        ],
        [{ opt1: 'value-a', opt2: 'string' }, asyncResult(ComponentMountError)],
      ],
      ComponentA
    )

    testCases(
      [
        [
          {
            opt1: 'some other string',
            aInstance: ComponentA({
              opt1: 'some string',
              opt2: 20,
            }),
          },
          (result) =>
            expect(result).resolves.toMatchObject({
              componentName: 'ComponentB',
            }),
        ],
        [
          {
            opt1: 'some other string',
            aInstance: {
              methodA: () => 'some methodA mock',
            },
          },
          (result) =>
            expect(result).resolves.toMatchObject({
              componentName: 'ComponentB',
            }),
        ],
        [
          {
            opt1: 'some other string',
            aInstance: {
              methodA: 'some string',
            },
          },
          asyncResult(ComponentMountError),
        ],
      ],
      ComponentB
    )
  })

  test('components that depend on other components', () => {
    const ComponentA = component(
      'ComponentA',
      {
        opt1: 'string',
        opt2: 'string',
      },
      ({ opt1, opt2 }) => {
        return wait(100, {
          opt1,
          opt2,
          methodA: () => {
            return 'methodA-result'
          },
        })
      }
    )

    const ComponentB = component(
      'ComponentB',
      {
        instanceA: 'object',
        opt1: 'boolean',
      },
      ({ instanceA, opt1 }) => {
        return wait(100, {
          methodB: () => {
            return `${instanceA.methodA()}__methodB-${opt1 ? 'YES' : 'NO'}`
          },
        })
      }
    )

    return ComponentB({
      instanceA: ComponentA({
        opt1: 'some-opt-value',
        opt2: 'some-other-opt-value',
      }),
      opt1: true,
    }).then((instanceB) => {
      expect(instanceB.methodB()).toEqual('methodA-result__methodB-YES')
    })
  })

  test('unmount', () => {
    expect.assertions(8)
    const mockInstanceAUnmount = jest.fn()
    const mockInstanceBUnmount = jest.fn()
    const mockInstanceCUnmount = jest.fn()
    const mockConsoleLog = jest.fn()

    const consoleLog = console.log
    console.log = mockConsoleLog

    const ComponentA = component(
      'ComponentA',
      {
        opt1: 'string',
        opt2: 'string',
      },
      ({ opt1, opt2 }) => {
        return wait(100, {
          opt1,
          opt2,
          unmount: mockInstanceAUnmount,
        })
      }
    )

    const ComponentB = component(
      'ComponentB',
      {
        opt1: 'string',
        opt2: 'string',
      },
      ({ opt1, opt2 }) => {
        return wait(100, {
          opt1,
          opt2,
          unmount: mockInstanceBUnmount,
        })
      }
    )

    const ComponentC = component(
      'ComponentC',
      {
        instanceA: 'object',
        instanceB: 'object',
        opt1: 'boolean',
      },
      ({ instanceA, opt1 }) => {
        return wait(100, {
          instanceA,
          opt1,
          unmount: mockInstanceCUnmount,
        })
      }
    )

    const ComponentD = component(
      'ComponentD',
      {
        instanceC: 'object',
        opt1: 'number',
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ instanceC, opt1 }) => {
        // returns nothing, but unmount still works
        return wait(100, undefined)
      }
    )

    return ComponentD({
      opt1: 7,
      instanceC: ComponentC({
        instanceA: ComponentA({
          opt1: 'some-opt-value',
          opt2: 'some-other-opt-value',
        }),
        instanceB: ComponentB({
          opt1: 'some-opt-value',
          opt2: 'some-other-opt-value',
        }),
        opt1: true,
      }),
    })
      .then((instanceD) => {
        return instanceD.unmount()
      })
      .then(() => {
        expect(mockInstanceCUnmount).toHaveBeenCalledTimes(1)
        expect(mockInstanceBUnmount).toHaveBeenCalledTimes(1)
        expect(mockInstanceAUnmount).toHaveBeenCalledTimes(1)

        expect(mockConsoleLog).toHaveBeenCalledTimes(4)
        expect(mockConsoleLog).toHaveBeenNthCalledWith(
          1,
          'Will unmount: ComponentA#ComponentA_1'
        )
        expect(mockConsoleLog).toHaveBeenNthCalledWith(
          2,
          'Will unmount: ComponentB#ComponentB_1'
        )
        expect(mockConsoleLog).toHaveBeenNthCalledWith(
          3,
          'Will unmount: ComponentC#ComponentC_1'
        )
        expect(mockConsoleLog).toHaveBeenNthCalledWith(
          4,
          'Will unmount: ComponentD#ComponentD_1'
        )

        // restore console log
        console.log = consoleLog
      })
  })
})

describe('componentSync(componentName, mount, propTypes)', () => {
  const ComponentA = componentSync(
    'ComponentA',
    {
      opt1: 'string',
      opt2: 'number',
    },
    ({ opt1, opt2 }) => ({
      id: `id-${opt1}`,
      someOtherConfig: opt2,
      methodA: () => `methodA-${opt1}`,
    })
  )

  testCases(
    [
      [
        { opt1: 'value-a', opt2: 10 },
        (result) =>
          expect(result).toMatchObject({
            componentName: 'ComponentA',
            id: 'id-value-a',
            someOtherConfig: 10,
          }),
      ],
      [{ opt1: 'value-a', opt2: 'string' }, ComponentMountError],
    ],
    ComponentA
  )
})
