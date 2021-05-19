import { ComponentMountError, ComponentUnmountError } from './errors'

test('ComponentMountError', () => {
  const mountErr = new ComponentMountError(
    'TestComponent',
    new TypeError('Some invalid type')
  )

  expect(mountErr.message).toEqual(
    'TestComponent / Mount error: Some invalid type'
  )
})

test('ComponentUnmountError', () => {
  const mountErr = new ComponentUnmountError(
    'TestComponent',
    new TypeError('Some invalid type')
  )

  expect(mountErr.message).toEqual(
    'TestComponent / Unmount error: Some invalid type'
  )
})
