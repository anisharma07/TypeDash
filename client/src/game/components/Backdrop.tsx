/** Legacy page background: blend layer, animated gradient divs and the two planets. */
export function Backdrop() {
  return (
    <>
      <div className="background-blend"></div>
      <div className="background">
        <div></div>
        <div></div>
      </div>
      <img src="/images/right-planet.png" alt="right-planet" className="right-planet" />
      <img src="/images/left-planet.png" alt="left-planet" className="left-planet keyss" />
    </>
  );
}
