import React from 'react';
import { useContext, useEffect, useRef, useState } from 'react'
import { BackendContext } from '../context';
import { ABService } from '../service';
import { VariantProps } from './Variant';

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

  const experiment = useRef(ABService.getExperiment(name))
  const [variant, setVariant] = useState(experiment.current.selectedVariant);
  const backend = useContext(BackendContext);

  const loading = typeof variant !== 'number';

  useEffect(() => {
    const { id } = experiment.current;
    const go = async () => {
      const experimentIndex = await ABService.loadVariant(backend, experiment.current, id);
      setVariant(experimentIndex)
      ABService.setSelectedIndex(name, experimentIndex);
    }

    const { variantCount } = experiment.current;
    const actualVariantCount = children.reduce<number>((acc, child) => {
      // @ts-ignore
      const { props } = child;
      const { variant } = props;
      if (typeof variant === 'number') {
        return acc + 1;
      }
      return acc + (variant as number[]).length;
    }, 0)

    if (actualVariantCount !== variantCount) {
      throw new Error(`Experiment ${id} has an incorrect number of variants. Expected ${variantCount} but got ${actualVariantCount}`)
    }

    if (typeof variant !== 'number') {
      go();
    }
  }, [])

  if (typeof window === 'undefined') {
    return <>{loadingComponent}</>
  }

  if (loading) {
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