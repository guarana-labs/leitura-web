/**
 * Photos shown on the login page. The layout is image-agnostic: everything that
 * depends on a specific photo lives here, so changing or adding a photo means
 * adding an entry, not touching the page.
 *
 * Files go in `public/images/`. Provide a large version (~1700px wide) for desktop
 * and, ideally, a ~860px one for phones.
 */
export interface LoginImage {
  /** Stable identifier (e.g. for remembering or rotating later). */
  id: string
  /** Largest version, used as the fallback `src`. */
  src: string
  /** Optional responsive versions, as an `srcset` string (e.g. "/a-860.jpg 860w, /a-1722.jpg 1722w"). */
  srcSet?: string
  /** Describes the photo for screen readers. */
  alt: string
  /**
   * Which part of the photo to keep when it's cropped to fill the panel, as a CSS
   * `object-position` (e.g. "center", "0% 12%", "left top"). Defaults to "center".
   */
  focalPoint?: string
  /** Attribution shown, small, under the quote. */
  credit: { text: string; url?: string }
  /** Optional quote paired with this photo; the default reading quote is used otherwise. */
  quote?: { text: string; author: string }
}

export const LOGIN_IMAGES: LoginImage[] = [
  {
    id: 'jupiter-juno-pia21647',
    src: '/images/jupiter-1722.jpg',
    srcSet: '/images/jupiter-860.jpg 860w, /images/jupiter-1722.jpg 1722w',
    alt: 'Nuvens de Júpiter fotografadas pela sonda Juno, da NASA',
    // Keeps the planet's curved edge against black space in view.
    focalPoint: '0% 12%',
    credit: {
      text: 'Foto: NASA/JPL-Caltech/SwRI/MSSS · Gerald Eichstädt e Seán Doran',
      url: 'https://images.nasa.gov/details/PIA21647',
    },
  },
]

/**
 * The photo to show on this visit. With a single photo it's always that one; with
 * more, replace this with a rotation (random per visit, one per day, ...).
 */
export function getLoginImage(): LoginImage {
  return LOGIN_IMAGES[0]
}
