import React from 'react';
import { Backend } from "../types"
import { BackendContext } from '../context';

export type ABProviderProps = {
  backend: Backend,
  children: React.ReactNode
}

export const ABProvider = ({
  backend,
  children
}: ABProviderProps) => {
  return (
    <BackendContext.Provider value={backend}>
      {children}
    </BackendContext.Provider>
  )
}