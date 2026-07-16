export default function FeaturedSponsor() {
  return (
    <section className="sponsor wrap" aria-label="Featured founding advertiser">
      <div className="sponsorLabel">Featured founding advertiser</div>
      <div className="sponsorBody">
        <div className="sponsorBadge" aria-hidden="true">FRD</div>
        <div className="sponsorCopy">
          <p className="eyebrow">FREE RANGE DAD SUPPLY CO.</p>
          <h2>Gear for dads raising capable kids and refusing to hover.</h2>
          <p>
            Independent dad goods for the school run, the campsite, the sidelines,
            and every unsupervised snack in between.
          </p>
        </div>
        <a
          className="sponsorCta"
          href="https://www.freerangedadsupplyco.com/?utm_source=halftimedad&utm_medium=featured_sponsor&utm_campaign=founding_launch"
          target="_blank"
          rel="noreferrer sponsored"
        >
          Visit the Supply Co. <span aria-hidden="true">↗</span>
        </a>
      </div>
      <p className="sponsorDisclosure">A proud sibling brand and the primary sponsor of HalfTimeDad.</p>
    </section>
  );
}
