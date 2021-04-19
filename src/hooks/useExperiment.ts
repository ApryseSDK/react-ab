import { useContext, useEffect, useRef, useState } from "react";
import { BackendContext, SSRContext } from "../context";
import { ABService } from "../service";

export const useExperiment = (name: string): [number, boolean] => {
  const experiment = useRef(ABService.getExperiment(name));

  const ssr = useContext(SSRContext);
  const backend = useContext(BackendContext);

  const selectedSSRVariant = ssr?.[name];
  const isSSREnabled = typeof selectedSSRVariant === "number";

  const [variant, setVariant] = useState(isSSREnabled ? selectedSSRVariant : experiment.current.selectedVariant);
  const [loading, setLoading] = useState(typeof variant !== "number");
  useEffect(() => {
    setLoading(typeof variant !== "number");
  }, [variant]);

  useEffect(() => {
    const { id } = experiment.current;
    const go = async () => {
      const experimentIndex = await ABService.loadVariant(backend, experiment.current, id);
      setVariant(experimentIndex);
      ABService.setSelectedIndex(name, experimentIndex);
    };

    if (ABService.ssrEnabled && typeof variant === "number") {
      ABService.log(`(SSR) Setting variant for ${name} (${experiment.current.id}) to ${variant}`);
      backend?.setVariant(experiment.current.id, variant);
    }

    if (typeof variant !== "number") {
      go();
    }
  }, []);

  return [variant, loading];
};
