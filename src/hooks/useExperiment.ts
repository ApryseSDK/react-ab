import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BackendContext, SSRContext } from "../context";
import { ABService } from "../service";

export const useExperiment = (name: string) => {
  const ssr = useContext(SSRContext);
  const backend = useContext(BackendContext);

  const experiment = useMemo(() => ABService.getExperiment(name), [name]);

  const [variant, setVariant] = useState(() => {
    const selectedSSRVariant = ssr?.[name];
    const isSSREnabled = typeof selectedSSRVariant === "number";
    return isSSREnabled ? selectedSSRVariant : experiment.selectedVariant;
  });

  const [loading, setLoading] = useState(typeof variant !== "number");
  const [error, setError] = useState<string | null>(null);

  const getClientSide = useCallback(async () => {
    setLoading(true);

    try {
      const variantIndex = await ABService.loadVariant(backend, experiment, experiment.id);
      setVariant(variantIndex);
      ABService.setSelectedIndex(name, variantIndex);
      setError(null);
    } catch (error) {
      setError(String(error) || "unknown error loading variant");
    }

    setLoading(false);
  }, [backend, experiment, name]);

  useEffect(() => {
    if (!loading) return;
    getClientSide();
  }, [loading, experiment]);

  useEffect(() => {
    if (ABService.ssrEnabled && typeof variant === 'number') {
      ABService.log(`(SSR) Setting variant for ${name} (${experiment.id}) to ${variant}`);
      backend?.setVariant(experiment.id, variant);
    }
  }, [backend, experiment, variant, name])

  return {
    variant,
    loading,
    error,
    getClientSide,
  };
};
