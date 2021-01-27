import React from 'react';
import { formatLink } from '../util';

export type PageProps = {
  children: React.ReactNode;
  /**
   * The path or array of paths that the children should be rendered on
   */
  path?: string | string[];
  /**
   * Sets the default component. This will be rendered when no other paths match
   */
  isDefault?: boolean;
}

export const Page = ({
  children,
  path,
  isDefault
}: PageProps) => {
  return <>{children}</>
}

export type PageSwitchProps = {
  /**
   * AN array of Page components
   */
  children: React.ReactElement<PageProps>[]
  /**
   * The current pathname
   */
  pathname: string
}

/**
 * A component that renders certain components on certain pages.
 * Useful for only running AB tests on certain pages in a global component like a Nav bar.
 */
export const PageSwitch = ({
  children,
  pathname
}: PageSwitchProps) => {

  pathname = formatLink(pathname)

  const toRender = children.find(child => {
    // @ts-ignore
    let { path } = child.props;
    if (typeof path === 'undefined') return false;
    if (typeof path === 'string') {
      path = formatLink(path);
      return path === pathname;
    }
    return path.some(p => {
      return formatLink(p) === pathname;
    })
  })

  if (toRender) {
    return <>{toRender}</>;
  }

  return (
    <>
      {
        children.find(child => {
          // @ts-ignore
          return child.props.isDefault
        })
      }
    </>
  )
}