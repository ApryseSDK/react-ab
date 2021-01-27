import React from 'react';

export type VariantProps = {
  /**
   * What to render when this variant is selected
   */
  children: React.ReactNode,
  /**
   * The variant index. Can be either an array or a number. If an array is passed,
   * this variant will be rendered if the selected index matches any number in the array
   */
  variant: Number | Number[],
  /**
   * A description of the variant - is not used (only for readability)
   */
  description?: string
}

/**
 * A variant to be rendered inside an AB component
 */
export const Variant = ({
  children,
  variant,
  description
}: VariantProps) => {
  return <>{children}</>
}