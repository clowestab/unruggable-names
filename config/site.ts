// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Site
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
interface SiteConfig {
  name: string
  title: string
  emoji: string
  description: string
  previewImg: string
  localeDefault: string
  links: {
    twitter: string
    github: string
  }
}

export const SITE_CANONICAL = 'https://turboeth.xyz'

export const siteConfig: SiteConfig = {
  name: 'Unruggable subdomain rentals',
  title: 'Unruggable subdomain rentals',
  emoji: '⚡',
  description: 'Decentralized and trustless subname rentals in the Ethereum Name Service (ENS) ecosystem.',
  previewImg: `${SITE_CANONICAL}/preview.png`,
  localeDefault: 'en',
  links: {
    twitter: 'https://twitter.com/district_labs',
    github: 'https://github.com/turbo-eth',
  },
}
