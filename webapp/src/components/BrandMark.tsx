/** Shared travel-planner mark, also used for browser and installed-app icons. */
export default function BrandMark({ size = 64 }: { size?: number }) {
  return <img src="/vacay-mark.svg" width={size} height={size} alt="" aria-hidden="true" draggable={false} style={{ display: 'block', flexShrink: 0 }} />;
}
