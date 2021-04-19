import { Backend, SSRData } from './types';
import React from 'react';

export const BackendContext = React.createContext<Backend>(null);

export const SSRContext = React.createContext<SSRData | undefined>(null);