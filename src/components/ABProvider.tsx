import React from 'react';
import { Backend, SSRData } from "../types"
import { BackendContext, SSRContext } from '../context';
import { ABService } from '../service';

export type ABProviderProps = {
  backend: Backend,
  children: React.ReactNode,
  ssrVariants?: SSRData
}

export const ABProvider = ({
  backend,
  children,
  ssrVariants
}: ABProviderProps) => {

  if (!ABService.ssrEnabled) {
    throw new Error(`'SSR' must be enabled to use 'ssrVariants'. See the SSR guides for more info`)
  }

  return (
    <BackendContext.Provider value={backend}>
      <SSRContext.Provider value={ssrVariants}>
        {children}
      </SSRContext.Provider>
    </BackendContext.Provider>
  )
}