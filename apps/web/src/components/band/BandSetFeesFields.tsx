import {
  calculateDynamicFee,
  formatAverageFee,
  formatDynamicFeeBreakdown,
  type BandDynamicFeeOffer,
  type BandSetOffer,
} from '@bandie/data';
import {
  emptyDynamicFeeOffer,
  emptySetOffer,
  type DynamicFeeOfferDraft,
  type SetOfferDraft,
} from '../../lib/bandProfileDrafts';

type BandSetFeesFieldsProps = {
  mode: 'view' | 'edit';
  compact?: boolean;
  publicDisplay?: boolean;
  setOffers: BandSetOffer[];
  dynamicFeeOffers: BandDynamicFeeOffer[];
  draftSetOffers: SetOfferDraft[];
  draftDynamicFeeOffers: DynamicFeeOfferDraft[];
  onSetOffersChange: (offers: SetOfferDraft[]) => void;
  onDynamicFeeOffersChange: (offers: DynamicFeeOfferDraft[]) => void;
};

function DynamicFeeCalculatorPreview({ offer }: { offer: DynamicFeeOfferDraft | BandDynamicFeeOffer }) {
  const breakdown = formatDynamicFeeBreakdown(offer);
  const calculation = calculateDynamicFee(offer);

  if (!breakdown) {
    return (
      <p className="band-dynamic-fee-calculator band-dynamic-fee-calculator-empty">
        Enter appearance fee, session fee, overall length, and session duration to calculate the total.
      </p>
    );
  }

  return (
    <div className="band-dynamic-fee-calculator">
      <p className="band-dynamic-fee-calculator-total">
        <strong>{formatAverageFee(calculation.total)}</strong>
        <span>Calculated total</span>
      </p>
      <p className="band-dynamic-fee-calculator-breakdown">{breakdown}</p>
      {calculation.sessionCount != null ? (
        <p className="band-dynamic-fee-calculator-hint">
          {calculation.sessionCount} session{calculation.sessionCount === 1 ? '' : 's'} from overall
          length ÷ session duration (rounded up)
        </p>
      ) : null}
    </div>
  );
}

function FixedFeesView({ offers, compact }: { offers: BandSetOffer[]; compact?: boolean }) {
  if (!offers.length) {
    return null;
  }

  return (
    <ul className={`band-set-offers-list${compact ? ' band-set-offers-list-compact' : ''}`}>
      {offers.map((offer) => (
        <li key={offer.id} className={`band-set-offer-card${compact ? ' band-set-offer-card-compact' : ''}`}>
          <div className="band-set-offer-card-head">
            <strong>
              {offer.set_details?.trim() ||
                (offer.set_length_minutes != null
                  ? `${offer.set_length_minutes} min overall`
                  : 'Fixed fee option')}
            </strong>
            {offer.average_fee != null ? (
              <span className="band-set-offer-fee">{formatAverageFee(offer.average_fee)}</span>
            ) : null}
          </div>
          {compact ? (
            offer.set_length_minutes != null || offer.details?.trim() ? (
              <p className="band-set-offer-compact-meta">
                {offer.set_length_minutes != null ? `${offer.set_length_minutes} min overall` : null}
                {offer.set_length_minutes != null && offer.details?.trim() ? ' · ' : null}
                {offer.details?.trim() ?? null}
              </p>
            ) : null
          ) : (
            <dl className="band-set-offer-details">
              {offer.set_length_minutes != null ? (
                <>
                  <dt>Overall length</dt>
                  <dd>{offer.set_length_minutes} minutes</dd>
                </>
              ) : null}
              {offer.set_details?.trim() ? (
                <>
                  <dt>Set details</dt>
                  <dd>{offer.set_details}</dd>
                </>
              ) : null}
              {offer.average_fee != null ? (
                <>
                  <dt>Average fee</dt>
                  <dd>{formatAverageFee(offer.average_fee)}</dd>
                </>
              ) : null}
              {offer.details?.trim() ? (
                <>
                  <dt>Notes</dt>
                  <dd>{offer.details}</dd>
                </>
              ) : null}
            </dl>
          )}
        </li>
      ))}
    </ul>
  );
}

function DynamicFeesView({
  offers,
  compact,
  publicDisplay,
}: {
  offers: BandDynamicFeeOffer[];
  compact?: boolean;
  publicDisplay?: boolean;
}) {
  if (!offers.length) {
    return null;
  }

  return (
    <ul className={`band-set-offers-list${compact || publicDisplay ? ' band-set-offers-list-compact' : ''}`}>
      {offers.map((offer) => {
        const calculation = calculateDynamicFee(offer);
        const breakdown = formatDynamicFeeBreakdown(offer);

        return (
          <li
            key={offer.id}
            className={`band-set-offer-card band-dynamic-fee-card${compact || publicDisplay ? ' band-set-offer-card-compact' : ''}`}
          >
            <div className="band-set-offer-card-head">
              <strong>
                {offer.set_details?.trim() ||
                  (offer.overall_set_length_minutes != null
                    ? `${offer.overall_set_length_minutes} min overall`
                    : 'Set option')}
              </strong>
              {calculation.total != null ? (
                <span className="band-set-offer-fee">{formatAverageFee(calculation.total)}</span>
              ) : null}
            </div>
            {publicDisplay ? (
              offer.details?.trim() ? (
                <p className="band-set-offer-compact-meta">{offer.details}</p>
              ) : null
            ) : compact ? (
              breakdown ? <p className="band-set-offer-compact-meta">{breakdown}</p> : null
            ) : (
              <>
                <DynamicFeeCalculatorPreview offer={offer} />
                <dl className="band-set-offer-details">
                  {offer.overall_set_length_minutes != null ? (
                    <>
                      <dt>Overall length</dt>
                      <dd>{offer.overall_set_length_minutes} minutes</dd>
                    </>
                  ) : null}
                  {offer.set_details?.trim() ? (
                    <>
                      <dt>Set details</dt>
                      <dd>{offer.set_details}</dd>
                    </>
                  ) : null}
                  {offer.appearance_fee != null ? (
                    <>
                      <dt>Appearance fee</dt>
                      <dd>{formatAverageFee(offer.appearance_fee)}</dd>
                    </>
                  ) : null}
                  {offer.session_fee != null ? (
                    <>
                      <dt>Session fee</dt>
                      <dd>{formatAverageFee(offer.session_fee)}</dd>
                    </>
                  ) : null}
                  {offer.session_duration_minutes != null ? (
                    <>
                      <dt>Session duration</dt>
                      <dd>{offer.session_duration_minutes} minutes</dd>
                    </>
                  ) : null}
                  {offer.details?.trim() ? (
                    <>
                      <dt>Notes</dt>
                      <dd>{offer.details}</dd>
                    </>
                  ) : null}
                </dl>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PublicProfileFeesView({
  setOffers,
  dynamicFeeOffers,
}: {
  setOffers: BandSetOffer[];
  dynamicFeeOffers: BandDynamicFeeOffer[];
}) {
  if (!setOffers.length && !dynamicFeeOffers.length) {
    return null;
  }

  return (
    <ul className="band-set-offers-list band-set-offers-list-compact">
      {setOffers.map((offer) => (
        <li key={offer.id} className="band-set-offer-card band-set-offer-card-compact">
          <div className="band-set-offer-card-head">
            <strong>
              {offer.set_details?.trim() ||
                (offer.set_length_minutes != null
                  ? `${offer.set_length_minutes} min overall`
                  : 'Set option')}
            </strong>
            {offer.average_fee != null ? (
              <span className="band-set-offer-fee">{formatAverageFee(offer.average_fee)}</span>
            ) : null}
          </div>
          {offer.details?.trim() ? (
            <p className="band-set-offer-compact-meta">{offer.details}</p>
          ) : null}
        </li>
      ))}
      {dynamicFeeOffers.map((offer) => {
        const calculation = calculateDynamicFee(offer);

        return (
          <li key={offer.id} className="band-set-offer-card band-set-offer-card-compact">
            <div className="band-set-offer-card-head">
              <strong>
                {offer.set_details?.trim() ||
                  (offer.overall_set_length_minutes != null
                    ? `${offer.overall_set_length_minutes} min overall`
                    : 'Set option')}
              </strong>
              {calculation.total != null ? (
                <span className="band-set-offer-fee">{formatAverageFee(calculation.total)}</span>
              ) : null}
            </div>
            {offer.details?.trim() ? (
              <p className="band-set-offer-compact-meta">{offer.details}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function BandSetFeesFields({
  mode,
  compact = false,
  publicDisplay = false,
  setOffers,
  dynamicFeeOffers,
  draftSetOffers,
  draftDynamicFeeOffers,
  onSetOffersChange,
  onDynamicFeeOffersChange,
}: BandSetFeesFieldsProps) {
  if (mode === 'view') {
    const hasFixed = setOffers.length > 0;
    const hasDynamic = dynamicFeeOffers.length > 0;

    if (!hasFixed && !hasDynamic) {
      return null;
    }

    if (publicDisplay) {
      return <PublicProfileFeesView setOffers={setOffers} dynamicFeeOffers={dynamicFeeOffers} />;
    }

    if (compact) {
      return (
        <div className="band-set-fees-compact">
          {hasFixed ? (
            <div className="band-set-fees-compact-group">
              {hasDynamic ? <p className="band-set-fees-compact-label">Fixed fees</p> : null}
              <FixedFeesView offers={setOffers} compact />
            </div>
          ) : null}
          {hasDynamic ? (
            <div className="band-set-fees-compact-group">
              {hasFixed ? <p className="band-set-fees-compact-label">Dynamic fees</p> : null}
              <DynamicFeesView offers={dynamicFeeOffers} compact />
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <>
        {hasFixed ? (
          <div className="band-set-fees-subsection">
            <h3 className="band-workspace-subheading">Fixed fees</h3>
            <FixedFeesView offers={setOffers} />
          </div>
        ) : null}
        {hasDynamic ? (
          <div className="band-set-fees-subsection">
            <h3 className="band-workspace-subheading">Dynamic fees</h3>
            <DynamicFeesView offers={dynamicFeeOffers} />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="band-set-fees-subsection">
        <h3 className="band-workspace-subheading">Fixed fees</h3>
        <p className="directory-field-hint">
          Quote a single average fee for each set package — useful when pricing is straightforward.
        </p>
        {draftSetOffers.map((item, index) => (
          <div key={item.key} className="profile-editor-item band-set-offer-editor-item">
            <p className="band-set-offer-editor-label">Fixed option {index + 1}</p>
            <div className="profile-editor-row-grid">
              <div className="auth-field">
                <label htmlFor={`workspaceSetLength-${item.key}`}>Overall set length (minutes)</label>
                <input
                  id={`workspaceSetLength-${item.key}`}
                  inputMode="numeric"
                  value={item.set_length_minutes?.toString() ?? ''}
                  onChange={(event) => {
                    const next = [...draftSetOffers];
                    const value = event.target.value.trim();
                    next[index] = {
                      ...item,
                      set_length_minutes: value ? Number(value) : null,
                    };
                    onSetOffersChange(next);
                  }}
                />
              </div>
              <div className="auth-field">
                <label htmlFor={`workspaceSetDetails-${item.key}`}>Set details</label>
                <input
                  id={`workspaceSetDetails-${item.key}`}
                  value={item.set_details ?? ''}
                  placeholder="e.g. 2×45 mins"
                  onChange={(event) => {
                    const next = [...draftSetOffers];
                    next[index] = { ...item, set_details: event.target.value };
                    onSetOffersChange(next);
                  }}
                />
              </div>
            </div>
            <div className="profile-editor-row-grid">
              <div className="auth-field">
                <label htmlFor={`workspaceAverageFee-${item.key}`}>Average fee (£)</label>
                <input
                  id={`workspaceAverageFee-${item.key}`}
                  inputMode="numeric"
                  value={item.average_fee?.toString() ?? ''}
                  onChange={(event) => {
                    const next = [...draftSetOffers];
                    const value = event.target.value.trim();
                    next[index] = {
                      ...item,
                      average_fee: value ? Number(value) : null,
                    };
                    onSetOffersChange(next);
                  }}
                />
              </div>
              <div className="auth-field">
                <label htmlFor={`workspaceSetOfferDetails-${item.key}`}>Details</label>
                <input
                  id={`workspaceSetOfferDetails-${item.key}`}
                  value={item.details ?? ''}
                  placeholder="e.g. Includes DJ set between sets"
                  onChange={(event) => {
                    const next = [...draftSetOffers];
                    next[index] = { ...item, details: event.target.value };
                    onSetOffersChange(next);
                  }}
                />
              </div>
            </div>
            <div className="profile-editor-inline-actions">
              <button
                type="button"
                onClick={() =>
                  onSetOffersChange(draftSetOffers.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="auth-button auth-button-secondary"
          onClick={() => onSetOffersChange([...draftSetOffers, emptySetOffer()])}
        >
          Add fixed option
        </button>
      </div>

      <div className="band-set-fees-subsection">
        <h3 className="band-workspace-subheading">Dynamic fees</h3>
        <p className="directory-field-hint">
          Build a fee from an appearance amount plus a fee per session. Total = appearance + (sessions
          × session fee), where sessions = overall length ÷ session duration (rounded up).
        </p>
        {draftDynamicFeeOffers.map((item, index) => (
          <div key={item.key} className="profile-editor-item band-set-offer-editor-item">
            <p className="band-set-offer-editor-label">Dynamic option {index + 1}</p>
            <div className="profile-editor-row-grid">
              <div className="auth-field">
                <label htmlFor={`workspaceDynamicOverall-${item.key}`}>Overall set length (minutes)</label>
                <input
                  id={`workspaceDynamicOverall-${item.key}`}
                  inputMode="numeric"
                  value={item.overall_set_length_minutes?.toString() ?? ''}
                  placeholder="e.g. 180 for 3 hours"
                  onChange={(event) => {
                    const next = [...draftDynamicFeeOffers];
                    const value = event.target.value.trim();
                    next[index] = {
                      ...item,
                      overall_set_length_minutes: value ? Number(value) : null,
                    };
                    onDynamicFeeOffersChange(next);
                  }}
                />
              </div>
              <div className="auth-field">
                <label htmlFor={`workspaceDynamicSetDetails-${item.key}`}>Set details</label>
                <input
                  id={`workspaceDynamicSetDetails-${item.key}`}
                  value={item.set_details ?? ''}
                  placeholder="e.g. 3×1 hour sessions"
                  onChange={(event) => {
                    const next = [...draftDynamicFeeOffers];
                    next[index] = { ...item, set_details: event.target.value };
                    onDynamicFeeOffersChange(next);
                  }}
                />
              </div>
            </div>
            <div className="profile-editor-row-grid">
              <div className="auth-field">
                <label htmlFor={`workspaceAppearanceFee-${item.key}`}>Appearance fee (£)</label>
                <input
                  id={`workspaceAppearanceFee-${item.key}`}
                  inputMode="numeric"
                  value={item.appearance_fee?.toString() ?? ''}
                  onChange={(event) => {
                    const next = [...draftDynamicFeeOffers];
                    const value = event.target.value.trim();
                    next[index] = {
                      ...item,
                      appearance_fee: value ? Number(value) : null,
                    };
                    onDynamicFeeOffersChange(next);
                  }}
                />
              </div>
              <div className="auth-field">
                <label htmlFor={`workspaceSessionFee-${item.key}`}>Session fee (£)</label>
                <input
                  id={`workspaceSessionFee-${item.key}`}
                  inputMode="numeric"
                  value={item.session_fee?.toString() ?? ''}
                  onChange={(event) => {
                    const next = [...draftDynamicFeeOffers];
                    const value = event.target.value.trim();
                    next[index] = {
                      ...item,
                      session_fee: value ? Number(value) : null,
                    };
                    onDynamicFeeOffersChange(next);
                  }}
                />
              </div>
            </div>
            <div className="profile-editor-row-grid">
              <div className="auth-field">
                <label htmlFor={`workspaceSessionDuration-${item.key}`}>Session duration (minutes)</label>
                <input
                  id={`workspaceSessionDuration-${item.key}`}
                  inputMode="numeric"
                  value={item.session_duration_minutes?.toString() ?? ''}
                  placeholder="e.g. 45"
                  onChange={(event) => {
                    const next = [...draftDynamicFeeOffers];
                    const value = event.target.value.trim();
                    next[index] = {
                      ...item,
                      session_duration_minutes: value ? Number(value) : null,
                    };
                    onDynamicFeeOffersChange(next);
                  }}
                />
              </div>
              <div className="auth-field">
                <label htmlFor={`workspaceDynamicDetails-${item.key}`}>Details</label>
                <input
                  id={`workspaceDynamicDetails-${item.key}`}
                  value={item.details ?? ''}
                  placeholder="Optional notes for this package"
                  onChange={(event) => {
                    const next = [...draftDynamicFeeOffers];
                    next[index] = { ...item, details: event.target.value };
                    onDynamicFeeOffersChange(next);
                  }}
                />
              </div>
            </div>
            <DynamicFeeCalculatorPreview offer={item} />
            <div className="profile-editor-inline-actions">
              <button
                type="button"
                onClick={() =>
                  onDynamicFeeOffersChange(
                    draftDynamicFeeOffers.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="auth-button auth-button-secondary"
          onClick={() => onDynamicFeeOffersChange([...draftDynamicFeeOffers, emptyDynamicFeeOffer()])}
        >
          Add dynamic option
        </button>
      </div>
    </>
  );
}
