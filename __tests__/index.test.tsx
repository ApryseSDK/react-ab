import React from 'react';
import Enzyme, { mount } from 'enzyme';
import { Backend } from '../src/types';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { act } from 'react-dom/test-utils'

Enzyme.configure({ adapter: new Adapter() });
console.error = () => { }

import {
  ABProvider, ABTest, ABService, Variant, PageSwitch, Page
} from '../src';

let selectedVariant = 0;
let timeout = 0;
let numberVariants = 2;

const backend: Backend = {
  getVariant: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(selectedVariant)
      }, timeout)
    })
  }
}

type ConfigureOptions = {
  selectedVariant?: number;
  timeout?: number;
  numVariants?: number
}

const setupTest = (options: ConfigureOptions) => {
  if (typeof options.selectedVariant === 'number') {
    selectedVariant = options.selectedVariant
  }

  if (typeof options.timeout === 'number') {
    timeout = options.timeout;
  }

  if (typeof options.numVariants === 'number') {
    numberVariants = options.numVariants;
  } else {
    numberVariants = 2;
  }

  ABService.cleanState();
  ABService.registerExperiments({
    test1: {
      id: 'abc',
      variantCount: numberVariants,
      testingId: 1
    },
  })
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

let comp;

describe('AB testing suite tests', () => {

  afterEach(() => {
    try {
      comp.unmount();
    } catch {

    }
    
  })

  describe('Basic AB testing', () => {

    it('can do a simple AB test - first variation', async () => {
      setupTest({
        selectedVariant: 0,
        timeout: 0
      })
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })

    it('can do a simple AB test - second variation', async () => {
      setupTest({
        selectedVariant: 1,
        timeout: 0
      })
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeFalsy();
        expect(comp.find('#two').exists()).toBeTruthy();
      })
    })

    it('can do a simple AB test - with array - first option', async () => {
      setupTest({
        selectedVariant: 2,
        timeout: 0,
        numVariants: 3
      })
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={[0, 1]}>
                <div id='one'></div>
              </Variant>
              <Variant variant={2}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeFalsy();
        expect(comp.find('#two').exists()).toBeTruthy();
      })
    })

    it('can do a simple AB test - with array - second option', async () => {
      setupTest({
        selectedVariant: 1,
        timeout: 0,
        numVariants: 3
      })
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={[0, 1]}>
                <div id='one'></div>
              </Variant>
              <Variant variant={2}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })
  })

  describe('Fallback cases', () => {

    it('falls back to variant 0 on timeout', async () => {
      setupTest({
        selectedVariant: 1,
        timeout: 200
      })

      ABService.setVariantTimeout(100);
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        await wait(300);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })

    it('falls back to variant 0 on invalid variant selection', async () => {
      setupTest({
        selectedVariant: 10,
        timeout: 0
      })
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })

    it('falls back to variant 0 if AB testing is disabled', async () => {
      setupTest({
        selectedVariant: 1,
        timeout: 0
      })

      ABService.disable();
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })
  })

  describe('Variant overrides', () => {

    it('can override a variant with query params', async () => {
      setupTest({
        selectedVariant: 1,
        timeout: 0
      })

      global.window.location.search = '?force=1&variant=2'
  
      await act(async () => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeFalsy();
        expect(comp.find('#two').exists()).toBeTruthy();
      })
      // reset search
      global.window.location.search = ''
    })

  })

  describe('Error states', () => {
    it('fails in invalid amount of variants are passed - direct', async () => {
      setupTest({
        selectedVariant: 0,
        timeout: 0
      })
      expect(() => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
              <Variant variant={2}>
                <div id='three'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );
      }).toThrow()
    })

    it('fails in invalid amount of variants are passed - array', async () => {
      setupTest({
        selectedVariant: 0,
        timeout: 0
      })
      expect(() => {
        comp = mount(
          <ABProvider backend={backend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={[1,2,3,4]}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );
      }).toThrow()
    })

    it('fails if backend throws error', async () => {
      setupTest({
        selectedVariant: 1,
        timeout: 0
      })

      const tempBackend: Backend = {
        getVariant: async() => {
          throw new Error('test')
        }
      }

      await act(async () => {
        comp = mount(
          <ABProvider backend={tempBackend}>
            <ABTest name='test1' >
              <Variant variant={0}>
                <div id='one'></div>
              </Variant>
              <Variant variant={1}>
                <div id='two'></div>
              </Variant>
            </ABTest>
          </ABProvider>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })
  })

  describe('Utility components', () => {

    it('can render a page component', async () => {
      await act(async () => {
        comp = mount(
          <PageSwitch pathname='/test'>
            <Page path='/test'>
              <div id='one'></div>
            </Page>

            <Page isDefault>
              <div id='two'></div>
            </Page>
          </PageSwitch>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })

    it('can render a page component - default', async () => {
      await act(async () => {
        comp = mount(
          <PageSwitch pathname='/test/cool'>
            <Page path='/test'>
              <div id='one'></div>
            </Page>

            <Page isDefault>
              <div id='two'></div>
            </Page>
          </PageSwitch>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeFalsy();
        expect(comp.find('#two').exists()).toBeTruthy();
      })
    })

    it('can render a page component - as array', async () => {
      await act(async () => {
        comp = mount(
          <PageSwitch pathname='/test/cool'>
            <Page path={[
              '/test',
              '/test/cool'
            ]}>
              <div id='one'></div>
            </Page>

            <Page isDefault>
              <div id='two'></div>
            </Page>
          </PageSwitch>
        );

        
        await wait(100);
        comp.update()
        expect(comp.find('#one').exists()).toBeTruthy();
        expect(comp.find('#two').exists()).toBeFalsy();
      })
    })

  })
})