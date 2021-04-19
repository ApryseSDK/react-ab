import React from 'react';
import { useContext, useEffect, useRef, useState } from 'react'
import { BackendContext, SSRContext } from '../context';
import { ABService } from '../service';
import { VariantProps } from './Variant';
import { useExperiment } from '../hooks/useExperiment';

const DefaultPlaceholder = <></>;

export type ABTestProps = {
  /**
   * Must be an array of Variants
   */
  children: React.ReactElement<VariantProps>[],
  /**
   * A placeholder component to show while the experiment is loading.
   * By default, nothing will be rendered
   */
  loadingComponent?: React.ReactNode,
  /**
   * The name of the experiment. This should be equal to a key
   * passed to 'registerTests'
   */
  name: string;
}

export const ABTest = ({
  children,
  name,
  loadingComponent = DefaultPlaceholder
}: ABTestProps) => {
  
  const experiment = useRef(ABService.getExperiment(name));

  const {variant, loading, isSSREnabled} = useExperiment(name)
  
  useEffect(() => {
    const { id } = experiment.current;

    const { variantCount } = experiment.current;
    const actualVariantCount = children.reduce<number>((acc, child) => {
      const { variant } = child.props;
      if (Array.isArray(variant)) {
        return acc + variant.length;
      }
      return acc + 1;
    }, 0);

    if (actualVariantCount !== variantCount) {
      throw new Error(`Experiment ${id} has an incorrect number of variants. Expected ${variantCount} but got ${actualVariantCount}`);
    }
  }, []);

  if (typeof window === 'undefined' && !isSSREnabled) {
    return <>{loadingComponent}</>
  }

  if (loading && !isSSREnabled) {
    return <>{loadingComponent}</>
  }

  const variantToRender = children.find(child => {
    // @ts-ignore
    const { variant: childVariant } = child.props;

    if (typeof childVariant === 'number') {
      return variant === childVariant
    }
    return (childVariant as number[]).includes(variant);
  })

  return <>{variantToRender || children[0]}</>
}