import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document

import { afterEach, describe, expect, it } from 'bun:test'
import { render } from 'preact'
import { LocaleProvider, useLocale } from './context.tsx'

describe('LocaleProvider + useLocale', () => {
  let host: HTMLDivElement
  afterEach(() => {
    if (host) host.remove()
  })

  function mount(node: preact.VNode): HTMLDivElement {
    host = document.createElement('div')
    document.body.appendChild(host)
    render(node, host)
    return host
  }

  it('falls back to core English defaults without a provider', () => {
    let captured: ReturnType<typeof useLocale> | null = null
    function Probe() {
      captured = useLocale()
      return null
    }
    mount(<Probe />)
    expect(captured!.locale).toBe('en')
    expect(captured!.t('nav.aria')).toBe('Course navigation')
    expect(captured!.t('nonexistent')).toBe('nonexistent')
  })

  it('returns active dictionary entries when wrapped', () => {
    let captured: ReturnType<typeof useLocale> | null = null
    function Probe() {
      captured = useLocale()
      return null
    }
    mount(
      <LocaleProvider
        locale="cs"
        dictionaries={{ cs: { greeting: 'Ahoj' }, en: { greeting: 'Hi' } }}
      >
        <Probe />
      </LocaleProvider>,
    )
    expect(captured!.locale).toBe('cs')
    expect(captured!.t('greeting')).toBe('Ahoj')
  })

  it('falls back to fallback locale, then core English, before returning the raw key', () => {
    let captured: ReturnType<typeof useLocale> | null = null
    function Probe() {
      captured = useLocale()
      return null
    }
    mount(
      <LocaleProvider
        locale="cs"
        fallback="en"
        dictionaries={{ cs: {}, en: { greeting: 'Hi' } }}
      >
        <Probe />
      </LocaleProvider>,
    )
    expect(captured!.t('greeting')).toBe('Hi')
    expect(captured!.t('nav.aria')).toBe('Course navigation')
    expect(captured!.t('totally-missing')).toBe('totally-missing')
  })

  it('interpolates {var} placeholders', () => {
    let captured: ReturnType<typeof useLocale> | null = null
    function Probe() {
      captured = useLocale()
      return null
    }
    mount(
      <LocaleProvider
        locale="cs"
        dictionaries={{ cs: { progress: '{current} z {total}' } }}
      >
        <Probe />
      </LocaleProvider>,
    )
    expect(captured!.t('progress', { current: 3, total: 9 })).toBe('3 z 9')
  })

  it('preserves unknown placeholders verbatim', () => {
    let captured: ReturnType<typeof useLocale> | null = null
    function Probe() {
      captured = useLocale()
      return null
    }
    mount(
      <LocaleProvider locale="en" dictionaries={{ en: { hello: 'Hi {who}' } }}>
        <Probe />
      </LocaleProvider>,
    )
    expect(captured!.t('hello')).toBe('Hi {who}')
  })

  it('exposes available locales', () => {
    let captured: ReturnType<typeof useLocale> | null = null
    function Probe() {
      captured = useLocale()
      return null
    }
    mount(
      <LocaleProvider
        locale="cs"
        available={['cs', 'en']}
        dictionaries={{ cs: {}, en: {} }}
      >
        <Probe />
      </LocaleProvider>,
    )
    expect(captured!.available).toEqual(['cs', 'en'])
  })
})
