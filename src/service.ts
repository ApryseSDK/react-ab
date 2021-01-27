import { queryToObject } from './util';
import { Test, Backend } from './types';

type RegisteredTest = Test & {
  selectedVariant: number | undefined,
}

class ABServiceClass {

  private _experiments: Record<string, RegisteredTest>
  private _disabled: boolean;
  private _log: boolean;
  private _timeout: number;

  constructor() {
    this.cleanState();
  }

  // For testing
  cleanState() {
    this._experiments = {};
    this._disabled = false;
    this._log = false;
    this._timeout = 1500;
  }

  /**
   * Disables AB testing.
   * When AB tests are disabled, the AB tests
   * will always render the Variant with index 0
   */
  disable() {
    this._disabled = true;
  }

  /**
   * Sets the maximum amount of time (in ms) to wait for a variant index to be resolved from the backend.
   * Once a request times out, variant index 0 will be chosen
   */
  setVariantTimeout(timeout: number) {
    this._timeout = timeout;
  }

  /**
   * Registers tests that you can use in your components.
   * Accepts an object, where the key is the name of the test,
   * and the value is information about the test.
   * 
   * The name of each test is passed to the ABTest component. 
   */
  registerExperiments(experiments: Record<string, Test>) {
    this._experiments = Object.keys(experiments).reduce((acc, name) => {
      acc[name] = {
        ...experiments[name],
        selectedVariant: undefined
      }
      return acc;
    }, this._experiments)
  }

  /**
   * Enables debug logging
   */
  enableLogging() {
    this._log = true;
  }

  private log(string: string) {
    if (this._log) {
      console.log(string)
    }
  }

  getExperiment(name: string): RegisteredTest {
    const test = this._experiments[name];
    if (!test) throw new Error(`[Experiment] Experiment '${name}' is not registered. Please make sure you call 'registerExperiments' as soon as possible in your application`);
    return test;
  }

  setSelectedIndex(name: string, index: number) {
    this._experiments[name].selectedVariant = index;
  }

  async loadVariant(backend: Backend, experiment: RegisteredTest, id: string): Promise<number> {
    if (this._disabled) {
      this.log(`[Experiment] ${id}: Experiments disabled - defaulting to 0`);
      return Promise.resolve(0);
    }
  
    if (typeof window !== 'undefined' && typeof experiment.testingId !== 'undefined') {
      const search: Record<any, any> = queryToObject(window.location);
      if (search.force && search.variant && search.force == experiment.testingId) {
        this.log(`[Experiment] ${id}: Forcing variant ${search.variant}`);
        return Promise.resolve(Number(search.variant));
      }
    }
    
    let timeout;
    const experimentIndex: number = await Promise.race([
      new Promise(resolve => {
        backend.getVariant(id).then(index => {
          this.log(`[Experiment] ${id}: Selected variant ${index}`);
          return resolve(index);
        }).catch((error) => {
          console.error(error);
          return resolve(0);
        })
      }),
      new Promise(resolve => {
        timeout = setTimeout(() => {
          this.log(`[Experiment] ${id}: Request timed out - defaulting to variant 0`);
          resolve(0)
        }, this._timeout)
      })
    ]) as number;

    clearTimeout(timeout)
  
    return experimentIndex;
  }
}

export const ABService = new ABServiceClass();