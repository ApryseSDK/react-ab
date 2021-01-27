
export type Backend = {
  /**
   * A function that returns a variant index for a specific experiment.
   * This function should call out to your AB test provider and fetch an experiment index
   */
  getVariant: (experimentId: string) => Promise<number>
}

export type Test = {
  /**
   * How many variants this test expects to have
   */
  variantCount: number;
  /**
   * The ID(s) of this experiment. If just a string is passed, it will be used in every environment.
   * If an object is passed, the ID will be chosen based off the environment passed to the provider.
   */
  id: string;

  /**
   * A unique ID that can be used for testing, specifically forcing a variant
   * via query params
   */
  testingId?: number
}
