/**
 * Keyboard-accessible skip link. Visually hidden until focused — pressing Tab
 * from the address bar reveals the link and lets keyboard and screen-reader
 * users jump past the nav header straight to the main content.
 *
 * Pair this with id="main-content" on each page's <main> or top-level content
 * wrapper.
 */
export default function SkipToContent({ targetId = 'main-content' }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[#003366] focus:font-semibold focus:shadow-lg focus:outline focus:outline-2 focus:outline-[#003366]"
    >
      Skip to main content
    </a>
  );
}
