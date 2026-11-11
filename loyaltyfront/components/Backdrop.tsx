/** Full-screen restaurant photo with the dark overlays used on every page. */
export function Backdrop() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/restaurant-bg.jpg')" }}
        role="img"
        aria-label=""
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.62)_100%)]" />
    </div>
  );
}
