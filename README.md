# PDFTron React AB Testing

AB testing tools for React projects.

## Features

- 🚀 Integrates with any AB testing provider
- 🔄 [Hot swappable backends](#backends) means you you switch AB providers without rewriting all your code
- 🔰 Easy to use API and [React components](#components)
- ⚠️ [Robust error handling](#error-handling) and fallback cases
- 🚦[Variant forcing](#forcing-variants) for testing and debugging
- 📟 [SSR support](#ssr)
- 💥 Much more!

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- Documentation
  - [Experiments](#experiments)
  - [Backends](#backends)
  - [Components](#components)
    - [ABProvider](#abprovider)
    - [ABTest](#abtest)
    - [Variant](#variant)
    - [PageSwitch](#pageswitch)
    - [Page](#page)
  - [Error handling](#error-handling)
  - [Timeouts](#timeouts)
  - [Disable AB testing](#disable-ab-testing)
  - [Testing & Debugging](#testing)
    - [Forcing variants](#forcing-variants)
    - [Logging](#enable-logging)
  - [SSR](#ssr)

## Installation

`yarn add @pdftron/react-ab`

Also requires React and React DOM as peer dependencies.

## Usage

First, you need to register your [experiments](#experiments) with the `ABService`. This should happen as soon as possible in your application.

```tsx
import { ABService } from '@pdftron/react-ab';

ABService.registerExperiments({
  buttonTest: {
    id: 'experimentID',
    variantCount: 2
  }
});
```

Next, you must wrap your entire app in the Provider component, and provide a [backend](#backends) for it to use.

```tsx
import { ABService, ABProvider } from '@pdftron/react-ab';
import GoogleOptimizeBackend from './backend'

ABService.registerTests({
  buttonTest: {
    id: 'experimentID',
    variantCount: 2
  }
});

export default () => {
  return (
    <ABProvider backend={GoogleOptimizeBackend}>
      <App />
    </ABProvider>
  )
}
```

Now, anywhere in your app, you can set up an AB test with the [`ABTest`](#abtest) and [`Variant`](#variant) components:

```tsx
import { ABTest, Variant } from '@pdftron/react-ab';

export const Button = ({text}) => {

  return (
    <ABTest name='buttonTest'>
      <Variant variant={0}> 
        <button style={{color: 'blue'}}>
          {text}
        </button>
      </Variant>
      <Variant variant={1}> 
        <button style={{color: 'red'}}>
          {text}
        </button>
      </Variant>
    </ABTest>
  )
}
```

The `ABTest` component will render whichever variant your backend specifies. In this scenerio, if the backend returns `0`, then it will render a blue button, if it returns `1` it will render a red button.

## Experiments

An "experiment" is an object that specifies the experiment name, its ID, and how many variants it should have. There are also a few other useful options you can set.

To register a test, call `ABService.registerExperiments` and pass in an object containing your experiments. The key is the name of the experiment, and the value is data describing that experiment.

```ts
ABService.registerExperiments({
  buttonTest: {
    id: 'experimentID',
    variantCount: 2
  }
});
```

Each experiment contains the following data:

- **`id`** (string) the ID of the experiment. This will be passed into your [backends](#backends) `getVariant` function.
- **`variantCount`** (number) how many variants this experiment is expected to have.
- **`testingId`** (number - optional) A unique ID/Index that is used purely for testing. See [testing](#testing) for more details


## Backends

A "backend" in this context is just an object that implements an interface that will be used by the component libarary.

A backend must satisfy the following interface:

```ts
type Backend = {
  getVariant: (experimentId: string) => Promise<number>;
  setVariant?: (experimentId: string, variant: number) => void;
}
```

The `getVariant` function accepts an experiment ID, and must return which variant of that experiment to use. This is where you would call your AB providers API to get a variant.

The [`setVariant`](#ssr) function is used for the SSR feature. It is only required if SSR is enabled.

**Example**

This example uses Google Optimize and GTAG to get a variant index, but you could use any provider you wish.

```ts
const GoogleOptimizeBackend = {
  getVariant: (experimentId) => {
    return new Promise(resolve => {
      gtag('event', 'optimize.callback', {
        name: experimentId,
        callback: (value) => {
          resolve(Number(value));
        }
      })
    })
  }
}
```

## Components

### `ABProvider`

This is a high level component that must wrap all instances of `ABTest` component. It should be at the very top of your application.

#### Props

- **`backend`** ([Backend](#backends)) the backend to use for your experiments
- **`children`** (ReactNode) React children to render
- **`ssrVariants`** (Object) See the [SSR Guide](#ssr) for more info

**Example**

```tsx
import { ABProvider } from '@pdftron/react-ab';

const backend = {
  getVariant: async (expId) => {
    const result = await fetch(`http://my-provider.com/api/get-variant?id=${expId}`);
    const json = await result.json();
    const { variantIndex } = json;
    return variantIndex;
  }
}

export const Root = () => {
  return (
    <ABProvider backend={backend}>
      <App />
    </ABProvider>
  )
}
```

### `ABTest`

This is a wrapper component that is the heart of your AB tests. It accepts a set of Variants, and renders only one depending on what index your `getVariant` function returns.

#### Props

- **`name`** (string) the name of the experiement that this represents. The experiment must be registered before you can use it. This should equal the key of the experiment that you pass to `registerExperiments`.  See [experiments](#experiments) for more info.
- **`children`** ([Variant](#variant)[]) The variants for this experiment
- **`loadingComponent`** (ReactNode - optional) A placeholder component to render while the experiment is loading. By default, nothing is rendered.

**Example**

```tsx
import { ABTest, Variant } from '@pdftron/react-ab'

export default () => {
  return (
    <ABTest name='experiment-name' loadingComponent={<div>Loading...</div>}>
      <Variant variant={0}>
        <p>This is rendered if `0` is returned from your backends `getVariant` function</p>
      </Variant>
      <Variant variant={1}>
        <p>This is rendered if `1` is returned from your backends `getVariant` function</p>
      </Variant>
    </ABTest>
  )
}
```

### `Variant`

This component represents a single or multiple variants for your experiment. The children of this component are only rendered if the `variant` is chosen.

#### Props

- **`variant` (number | number[])** the index of the variant. If the result of `getVariant` matches this number, then the children will be rendered. If you pass an array of numbers, it will render the children if the selected variant mathces any number in the array
- **`children`** (ReactNode) the children to render if this variant is selected
- **`description`** (string - optional) a description of the variant, used purely for readability

**Example**

```tsx
import { ABTest, Variant } from '@pdftron/react-ab'

export default () => {
  return (
    <ABTest name='experiment-name' loadingComponent={<div>Loading...</div>}>
      <Variant variant={0} description="Original variant">
        <p>Rendered if variant 0 is selected</p>
      </Variant>
      <Variant variant={[1,2,3]} description="Rendered as an h1">
        <h1>Rendered if variant 1, 2, or 3 is selected</h1>
      </Variant>
      <Variant variant={4} description="Rendered as an h2">
        <h2>Rendered if variant 4 is selected</h2>
      </Variant>
    </ABTest>
  )
}
```

### `PageSwitch`

This is a utility component that only renders components on certain pages. It is not directly related to AB testing, but is useful in scenerios where you want to AB test parts of a global component (header, footer), but only on a certiain page.

This component is similar to a JS router.

#### Props

- **`pathname`** (string) The current pathname. Can be fetched from `window.location.pathname`, or from your JS router.
- **`children`** ([Page](#page)[]) An array of pages.

**Example**

This example sets up an AB test that changes the text of a header. However, this test will only run when the user is on `/contact-sales`. If the user is not on that page, it will default to the `Page` that has `isDefault` set.

```tsx
import { PageSwitch, Page } from '@pdftron/react-ab';

export const Footer = () => {
  return (
    <div>
      <ul>
        <li>Home</li>
        <li>Docs</li>

        <PageSwitch pathname={window.location.pathname}>
          <Page path='/contact-sales'>
            <ABTest name='sales-button'>
              <Variant variant={0}>
                <li>Free trial</li>
              </Variant>
              <Variant variant={1}>
                <li>Get Started</li>
              </Variant>
            </ABTest>
          </Page>

          <Page isDefault>
            <li>Free trial</li>
          </Page>
        </PageSwitch>

      </ul>
    </div>
  )
}
```

### `Page`

A component that gets rendered inside [`PageSwitch`](#pageswitch)

#### Props

Note: One of `path` or `isDefault` is required.

- **`path`** (string | string[] - optional) Only render this component if the pathname passed into `PageSwitch` matches this value or one of these values
- **`isDefault`** (boolean - optional) Render this component if no other Page components have a matching page.
- **`children`** (ReactNode) The children to render

See [PageSwitch](#pageswitch) for an example.

## Error handling

In the case of an error, the components will fall back to rendering the original variant (variant 0).

The following scenerios will cause the component to go into fallback mode:

- An error is thrown from your backend
- A variant index is returned from your backend that does not exist
- The call to `getVariant` on your backend times out. See [timeouts](#timeouts) for more info.
- [AB testing is disabled](#disable-ab-testing)

## Timeouts

By default, if your backend takes more than 1500 to return a variant from the `getVariant` function, the component will go into fallback mode and default to variant 0.

To change this timeout, you can call `ABService.setVariantTimeout(ms: number)` and pass a new value for this timeout (in ms).

For example, to change the timeout to 3 seconds, you would do

```ts
import { ABService } from '@pdftron/react-ab';

ABService.setVariantTimeout(3000)
```

## Disable AB testing

In some scenerios, you may want to disable AB testing for the whole app, but you might not want to strip out all your AB code. One common scenerio of this is if the users AdBlock extension blocks your AB provider code from being loaded.

In this scenerio, you can disable AB testing by calling `ABService.disable()`. This will set the AB suite into fallback mode, and variant `0` will always be rendered.

```ts
import { ABService } from '@pdftron/react-ab';

ABService.disable()
```

## Testing

### Forcing variants

You can test your experiments by setting query parameters that force an experiment to use a certain variant.

To force override an experiment, you must provide two query params:

- **`force`** (number) The `testingId` of the experiment to override. See [experiments](#experiments) for more info.
- **`variant`** (number) The variant index to force

**Example**

Consider the following configuration

```tsx
import {ABProvider, ABService, ABTest, Variant} from '@pdftron/react-ab';

ABService.registerTests({
  buttonTest: {
    id: 'experimentID',
    variantCount: 2,
    testingId: 1
  }
});

// Somewhere else in app
export default () => {
  return (
    <ABTest name='buttonTest'>
      <Variant variant={0}>
        <p>V1</p>
      </Variant>
      <Variant variant={1}>
        <p>V2</p>
      </Variant>
    </ABTest>
  )
}
```

To force variant zero, you could navigate to `http://localhost:8000?force=1&variant=0`

To force variant one, you could navigate to `http://localhost:8000?force=1&variant=1`

### Enable logging

To enable debug logging, call `ABService.enableLogging()`

```ts
import { ABService } from '@pdftron/react-ab';

ABService.enableLogging()
```

### SSR

If your application is server rendered, you may want to select and render your variant on the server in order to prevent content flashes when your site loads.

To enable server side rendering, please follow these steps:

1) **Pass `enableSSR` to your `registerExperiments` call**

```js
import { ABService } from '@pdftron/react-ab';

ABService.registerTests({
  buttonTest: {
    id: 'experimentID',
    variantCount: 2
  }
}, {
  enableSSR: true
});
```

2) **Pass a variant map you want to select to the `ABProvider`**

A variant map is just a object where the keys are the experiment name, and the value is the variant you want to select.

We also provide a [utility function](#ssr-utility) to handle this for you if you do not want to implement yourself.

```js
import { ABService, ABProvider } from '@pdftron/react-ab';

ABService.registerTests({
  buttonTest: {
    id: 'experimentID',
    variantCount: 2
  }
}, {
  enableSSR: true
});

export const Root = () => {
  return (
    <ABProvider 
      backend={backend}
      ssrVariants={{
        buttonTest: 1
      }}
    >
      <App />
    </ABProvider>
  )
}
```

3) **Add a `setVariant` function to your backend (optional)**

This function is used to report to your AB Testing service which variant you rendered.

Example using Google Optimize:
```js
const GoogleOptimizeBackend = {
  getVariant: (experimentId) => {
    // getVariant code
  },
  setVariant: (experimentId, variant) => {
    ga('set', 'exp', `${experimentId}.${variant}`);
  }
}
```


#### SSR utility

We provide a utility function to generate a variant map for you. It looks at all your registered experiments and outputs a map. It also handles client side hydration and cookies.

**`ABService.getSSRVariants(cookies: Record<string, any>, setCookie: (name: string, value: number) => void)`**

Params:

- **`cookies`** (object) A map of cookies in the request. Used for making sure the user always sees the same variants
- **`setCookie`** (function) A function that is called whenever a new cookie is generated and needs to be set. It is passed the cookie name and the cookie value.

Returns a map of cookies names -> variant indexes.

**Example (in the context of Next.js):**

```js
import { ABService, ABProvider } from '@pdftron/react-ab';

ABService.registerTests({
  buttonTest: {
    id: 'experimentID',
    variantCount: 2
  }
}, {
  enableSSR: true
});

export const Root = ({ variants }) => {
  return (
    <ABProvider 
      backend={backend}
      ssrVariants={variants}
    >
      <App />
    </ABProvider>
  )
}

export const getServerSideProps = async (context) => {
  const variants = ABService.getSSRVariants(
    context.req.cookies,
    (name, value) => {
      context.req.cookies.set(name, value)
    }
  )
  return {
    props: {
      variants
    },
  };
};
```




