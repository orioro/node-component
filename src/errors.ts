export class ComponentError extends Error {
  componentName: string
  sourceError: Error
}

export class ComponentMountError extends ComponentError {
  constructor(componentName: string, error: Error) {
    super(`${componentName} / Mount error: ${error.message}`)

    this.componentName = componentName
    this.sourceError = error
  }
}

export class ComponentUnmountError extends ComponentError {
  constructor(componentName: string, error: Error) {
    super(`${componentName} / Unmount error: ${error.message}`)

    this.componentName = componentName
    this.sourceError = error
  }
}
