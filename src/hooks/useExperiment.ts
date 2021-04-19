import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackendContext, SSRContext } from '../context';
import { ABService } from '../service';

export interface UseExperimentValue {
  /** The variant index to use for the experiment. */
  variant: number;
  /** Is loading async client-side variant. */
  loading: boolean;
  /** Errors with async client-side variant. */
  error: string;
  /** Call to retry a failed client-side variant. */
  getClientSide: () => Promise<void>;
  /** Is using server-side values for variant. */
  isSSREnabled: boolean;
}

/**
 * Returns variant number, as well as status if async client-side fetch is used.
 * @param name Name of the experiment. This will be cached, so changing it will
 * have no effect.
 */
export const useExperiment = (name: string): UseExperimentValue => {
  const nameRef = useRef(name);
  const experiment = useRef(ABService.getExperiment(name));

  const ssr = useContext(SSRContext);
  const backend = useContext(BackendContext);

  const selectedSSRVariant = ssr?.[nameRef.current];
  const isSSREnabled = typeof selectedSSRVariant === 'number';

  const [variant, setVariant] = useState<number | undefined>(() =>
    isSSREnabled ? selectedSSRVariant : experiment.current.selectedVariant
  );
  const noVariant = typeof variant !== 'number';

  const [loading, setLoading] = useState(noVariant);
  const [error, setError] = useState<string | null>(null);

  const getClientSide = useCallback(async () => {
    if (!noVariant) return;

    setLoading(true);

    try {
      const variantIndex = await ABService.loadVariant(backend, experiment.current, experiment.current.id);
      setVariant(variantIndex);
      ABService.setSelectedIndex(nameRef.current, variantIndex);
      setError(null);
    } catch (error) {
      setError(String(error) || 'unknown error loading variant');
    }

    setLoading(false);
  }, [backend, noVariant]);

  useEffect(() => {
    if (noVariant) getClientSide();
  }, [getClientSide, noVariant]);

  useEffect(() => {
    if (ABService.ssrEnabled && typeof variant === 'number') {
      ABService.log(`(SSR) Setting variant for ${nameRef.current} (${experiment.current.id}) to ${variant}`);
      backend?.setVariant(experiment.current.id, variant);
    }
  }, [backend, variant]);

  return useMemo<UseExperimentValue>(
    () => ({
      variant,
      loading,
      error,
      getClientSide,
      isSSREnabled,
    }),
    [variant, loading, error, getClientSide, isSSREnabled]
  );
};
