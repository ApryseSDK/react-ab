import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { BackendContext, SSRContext } from "../context";
import { ABService } from "../service";

/**
 *
 * @param name Name of the experiment. This will be cached, so changing it will
 * have no effect.
 */
export const useExperiment = (name: string) => {
  const nameRef = useRef(name);
  const experiment = useRef(ABService.getExperiment(name));

  const ssr = useContext(SSRContext);
  const backend = useContext(BackendContext);

  const [variant, setVariant] = useState<number | undefined>(() => {
    const selectedSSRVariant = ssr?.[nameRef.current];
    const isSSREnabled = typeof selectedSSRVariant === "number";
    return isSSREnabled ? selectedSSRVariant : experiment.current.selectedVariant;
  });
  const noVariant = typeof variant !== "number";

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
      setError(String(error) || "unknown error loading variant");
    }

    setLoading(false);
  }, [backend, noVariant]);

  
  useEffect(() => {
    if (noVariant) getClientSide();
  }, [getClientSide, noVariant]);

  useEffect(() => {
    if (ABService.ssrEnabled && typeof variant === "number") {
      ABService.log(`(SSR) Setting variant for ${nameRef.current} (${experiment.current.id}) to ${variant}`);
      backend?.setVariant(experiment.current.id, variant);
    }
  }, [backend, variant]);

  return {
    variant,
    loading,
    error,
    getClientSide,
  };
};
