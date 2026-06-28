import { useState, type FormEvent } from 'react';
import {
  ORGANISER_VENUE_TYPES,
  type OrganiserVenue,
  type OrganiserVenueInput,
  type OrganiserVenueType,
} from '@bandie/data';
import { OrganiserVenueImageField } from './OrganiserVenueImageField';

type OrganiserVenueFormProps = {
  initialVenue?: OrganiserVenue | null;
  submitting?: boolean;
  onSubmit: (input: OrganiserVenueInput, pendingImage?: File | null) => Promise<void>;
  onCancel?: () => void;
};

function emptyForm(): OrganiserVenueInput {
  return {
    name: '',
    venue_type: null,
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    capacity: null,
    notes: '',
    image_url: '',
  };
}

function formFromVenue(venue: OrganiserVenue): OrganiserVenueInput {
  return {
    name: venue.name,
    venue_type: venue.venue_type,
    address_line1: venue.address_line1 ?? '',
    address_line2: venue.address_line2 ?? '',
    city: venue.city ?? '',
    postcode: venue.postcode ?? '',
    contact_name: venue.contact_name ?? '',
    contact_email: venue.contact_email ?? '',
    contact_phone: venue.contact_phone ?? '',
    capacity: venue.capacity,
    notes: venue.notes ?? '',
    image_url: venue.image_url ?? '',
  };
}

export function OrganiserVenueForm({
  initialVenue = null,
  submitting = false,
  onSubmit,
  onCancel,
}: OrganiserVenueFormProps) {
  const [values, setValues] = useState<OrganiserVenueInput>(
    initialVenue ? formFromVenue(initialVenue) : emptyForm(),
  );
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof OrganiserVenueInput>(field: K, value: OrganiserVenueInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await onSubmit(values, pendingImage);
      if (!initialVenue) {
        setValues(emptyForm());
        setPendingImage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save venue.');
    }
  }

  return (
    <form className="auth-form organiser-venue-form" onSubmit={handleSubmit}>
      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      <OrganiserVenueImageField
        venueId={initialVenue?.id}
        value={values.image_url ?? ''}
        onChange={(url) => updateField('image_url', url)}
        onPendingFileChange={setPendingImage}
        disabled={submitting}
      />

      <div className="profile-editor-row-grid">
        <div className="auth-field">
          <label htmlFor="venueName">Venue name</label>
          <input
            id="venueName"
            required
            value={values.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="e.g. The Crown & Anchor"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="venueType">Venue type</label>
          <select
            id="venueType"
            value={values.venue_type ?? ''}
            onChange={(event) =>
              updateField('venue_type', (event.target.value || null) as OrganiserVenueType | null)
            }
          >
            <option value="">Select type</option>
            {ORGANISER_VENUE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="venueAddress1">Address line 1</label>
        <input
          id="venueAddress1"
          value={values.address_line1 ?? ''}
          onChange={(event) => updateField('address_line1', event.target.value)}
          placeholder="Street address"
        />
      </div>

      <div className="auth-field">
        <label htmlFor="venueAddress2">Address line 2</label>
        <input
          id="venueAddress2"
          value={values.address_line2 ?? ''}
          onChange={(event) => updateField('address_line2', event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="profile-editor-row-grid">
        <div className="auth-field">
          <label htmlFor="venueCity">City / town</label>
          <input
            id="venueCity"
            value={values.city ?? ''}
            onChange={(event) => updateField('city', event.target.value)}
            placeholder="e.g. Guildford"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="venuePostcode">Postcode</label>
          <input
            id="venuePostcode"
            value={values.postcode ?? ''}
            onChange={(event) => updateField('postcode', event.target.value)}
            placeholder="e.g. GU1 4AA"
          />
        </div>
      </div>

      <div className="profile-editor-row-grid">
        <div className="auth-field">
          <label htmlFor="venueContactName">Contact name</label>
          <input
            id="venueContactName"
            value={values.contact_name ?? ''}
            onChange={(event) => updateField('contact_name', event.target.value)}
            placeholder="On-site contact"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="venueCapacity">Capacity</label>
          <input
            id="venueCapacity"
            type="number"
            min={1}
            value={values.capacity ?? ''}
            onChange={(event) =>
              updateField('capacity', event.target.value ? Number(event.target.value) : null)
            }
            placeholder="Approx. audience size"
          />
        </div>
      </div>

      <div className="profile-editor-row-grid">
        <div className="auth-field">
          <label htmlFor="venueContactEmail">Contact email</label>
          <input
            id="venueContactEmail"
            type="email"
            value={values.contact_email ?? ''}
            onChange={(event) => updateField('contact_email', event.target.value)}
            placeholder="bookings@venue.example"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="venueContactPhone">Contact phone</label>
          <input
            id="venueContactPhone"
            type="tel"
            value={values.contact_phone ?? ''}
            onChange={(event) => updateField('contact_phone', event.target.value)}
            placeholder="e.g. 01483 123456"
          />
        </div>
      </div>

      <div className="auth-field">
        <label htmlFor="venueNotes">Notes</label>
        <textarea
          id="venueNotes"
          rows={3}
          value={values.notes ?? ''}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder="Load-in details, parking, preferred genres, noise limits…"
        />
      </div>

      <div className="workspace-edit-actions">
        <button type="submit" className="auth-button" disabled={submitting}>
          {submitting ? 'Saving…' : initialVenue ? 'Save changes' : 'Add venue'}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="auth-button auth-button-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
