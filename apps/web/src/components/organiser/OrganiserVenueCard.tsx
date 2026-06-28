import {
  formatOrganiserVenueAddress,
  formatOrganiserVenueLocation,
  formatOrganiserVenueType,
  type OrganiserVenue,
} from '@bandie/data';

type OrganiserVenueCardProps = {
  venue: OrganiserVenue;
  onEdit: () => void;
  onDelete: () => void;
  submitting?: boolean;
};

export function OrganiserVenueCard({
  venue,
  onEdit,
  onDelete,
  submitting = false,
}: OrganiserVenueCardProps) {
  const address = formatOrganiserVenueAddress(venue);
  const location = formatOrganiserVenueLocation(venue);

  return (
    <article className="organiser-venue-card">
      {venue.image_url ? (
        <div className="organiser-venue-card-photo">
          <img src={venue.image_url} alt="" />
        </div>
      ) : null}
      <div className="organiser-venue-card-head">
        <div className="organiser-venue-card-identity">
          <div className="organiser-venue-card-title-row">
            <strong>{venue.name}</strong>
            <span className="band-member-role">{formatOrganiserVenueType(venue.venue_type)}</span>
          </div>
          {address ? <p className="organiser-venue-card-meta">{address}</p> : null}
          {!address && location ? <p className="organiser-venue-card-meta">{location}</p> : null}
        </div>
        <div className="organiser-venue-card-actions">
          <button
            type="button"
            className="band-member-btn"
            disabled={submitting}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="band-member-btn band-member-btn-danger"
            disabled={submitting}
            onClick={onDelete}
          >
            Remove
          </button>
        </div>
      </div>

      <dl className="organiser-venue-card-details">
        {venue.contact_name ? (
          <div>
            <dt>Contact</dt>
            <dd>{venue.contact_name}</dd>
          </div>
        ) : null}
        {venue.contact_email ? (
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${venue.contact_email}`}>{venue.contact_email}</a>
            </dd>
          </div>
        ) : null}
        {venue.contact_phone ? (
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${venue.contact_phone}`}>{venue.contact_phone}</a>
            </dd>
          </div>
        ) : null}
        {venue.capacity ? (
          <div>
            <dt>Capacity</dt>
            <dd>{venue.capacity.toLocaleString('en-GB')}</dd>
          </div>
        ) : null}
      </dl>

      {venue.notes ? <p className="organiser-venue-card-notes">{venue.notes}</p> : null}
    </article>
  );
}
