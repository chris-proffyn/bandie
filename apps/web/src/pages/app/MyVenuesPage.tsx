import { useCallback, useEffect, useState } from 'react';
import {
  createOrganiserVenue,
  deleteOrganiserVenue,
  listMyOrganiserVenues,
  updateOrganiserVenue,
  uploadOrganiserVenueImage,
  type OrganiserVenue,
  type OrganiserVenueInput,
} from '@bandie/data';
import { OrganiserVenueCard } from '../../components/organiser/OrganiserVenueCard';
import { OrganiserVenueForm } from '../../components/organiser/OrganiserVenueForm';
import { HeadingWithHelp } from '../../components/ui/InfoHelp';
import '../../styles/workspace.css';

export function MyVenuesPage() {
  const [venues, setVenues] = useState<OrganiserVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionVenueId, setActionVenueId] = useState<string | null>(null);

  const loadVenues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await listMyOrganiserVenues();
      setVenues(rows);
    } catch (err) {
      setVenues([]);
      setError(err instanceof Error ? err.message : 'Unable to load venues.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues().catch(() => undefined);
  }, [loadVenues]);

  async function handleCreate(input: OrganiserVenueInput, pendingImage?: File | null) {
    setSubmitting(true);
    try {
      let venue = await createOrganiserVenue(input);
      if (pendingImage) {
        const imageUrl = await uploadOrganiserVenueImage(venue.id, pendingImage);
        venue = await updateOrganiserVenue(venue.id, { ...input, image_url: imageUrl });
      }
      setShowAddForm(false);
      await loadVenues();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(
    venueId: string,
    input: OrganiserVenueInput,
    pendingImage?: File | null,
  ) {
    setSubmitting(true);
    try {
      if (pendingImage) {
        const imageUrl = await uploadOrganiserVenueImage(venueId, pendingImage);
        await updateOrganiserVenue(venueId, { ...input, image_url: imageUrl });
      } else {
        await updateOrganiserVenue(venueId, input);
      }
      setEditingVenueId(null);
      await loadVenues();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(venue: OrganiserVenue) {
    if (!window.confirm(`Remove ${venue.name} from your venues?`)) {
      return;
    }

    setActionVenueId(venue.id);
    setError(null);

    try {
      await deleteOrganiserVenue(venue.id);
      if (editingVenueId === venue.id) {
        setEditingVenueId(null);
      }
      await loadVenues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove venue.');
    } finally {
      setActionVenueId(null);
    }
  }

  const editingVenue = editingVenueId
    ? venues.find((venue) => venue.id === editingVenueId) ?? null
    : null;

  return (
    <div className="my-venues-page">
      <header className="my-bands-header">
        <div>
          <p className="my-bands-eyebrow">Organiser workspace</p>
          <HeadingWithHelp
            as="h1"
            helpLabel="About my venues"
            help={
              <p>
                Keep pubs, clubs and event spaces you manage in one place. Use these when booking bands
                and planning gigs.
              </p>
            }
          >
            My venues
          </HeadingWithHelp>
        </div>
        {!showAddForm && !editingVenue ? (
          <div className="my-bands-header-actions">
            <button
              type="button"
              className="directory-btn directory-btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add venue
            </button>
          </div>
        ) : null}
      </header>

      {error ? <div className="auth-message auth-message-error">{error}</div> : null}

      {showAddForm ? (
        <section className="workspace-section panel organiser-venue-editor">
          <div className="workspace-section-header">
            <h2>Add venue</h2>
          </div>
          <OrganiserVenueForm
            submitting={submitting}
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
          />
        </section>
      ) : null}

      {editingVenue ? (
        <section className="workspace-section panel organiser-venue-editor">
          <div className="workspace-section-header">
            <h2>Edit {editingVenue.name}</h2>
          </div>
          <OrganiserVenueForm
            initialVenue={editingVenue}
            submitting={submitting}
            onSubmit={(input, pendingImage) => handleUpdate(editingVenue.id, input, pendingImage)}
            onCancel={() => setEditingVenueId(null)}
          />
        </section>
      ) : null}

      {loading ? (
        <div className="panel">
          <p>Loading venues…</p>
        </div>
      ) : null}

      {!loading && venues.length ? (
        <>
          <p className="my-bands-count">
            {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
          </p>
          <ul className="organiser-venue-grid">
            {venues.map((venue) => (
              <li key={venue.id}>
                {editingVenueId === venue.id ? null : (
                  <OrganiserVenueCard
                    venue={venue}
                    submitting={actionVenueId === venue.id}
                    onEdit={() => {
                      setShowAddForm(false);
                      setEditingVenueId(venue.id);
                    }}
                    onDelete={() => handleDelete(venue)}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {!loading && !venues.length && !showAddForm ? (
        <div className="directory-empty-state panel">
          <strong>No venues yet</strong>
          <p>Add the pubs, clubs or event spaces you book bands for.</p>
          <button
            type="button"
            className="directory-btn directory-btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Add your first venue
          </button>
        </div>
      ) : null}
    </div>
  );
}
