import type { BandDynamicFeeOffer, BandSetOffer, OrganiserVenue, UserProfile } from '@bandie/data';
import {
  formatOrganiserVenueAddress,
  formatOrganiserVenueLocation,
  formatOrganiserVenueType,
} from '@bandie/data';
import type { User } from '@supabase/supabase-js';
import { formatDisplayDate } from './profileHelpers';

export type SetDurationOption = {
  value: string;
  label: string;
};

export type BookingEnquiryFormValues = {
  eventDate: string;
  eventTime: string;
  setDuration: string;
  selectedVenueId: string;
  venue: string;
  budget: string;
  additionalNotes: string;
};

export const emptyBookingEnquiryForm = (): BookingEnquiryFormValues => ({
  eventDate: '',
  eventTime: '',
  setDuration: '',
  selectedVenueId: '',
  venue: '',
  budget: '',
  additionalNotes: '',
});

export function buildSetDurationOptions(
  setOffers: BandSetOffer[],
  dynamicFeeOffers: BandDynamicFeeOffer[],
): SetDurationOption[] {
  const seen = new Set<string>();
  const options: SetDurationOption[] = [];

  function addOption(label: string) {
    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    options.push({ value: trimmed, label: trimmed });
  }

  for (const offer of setOffers) {
    if (offer.set_details?.trim()) {
      addOption(offer.set_details);
    } else if (offer.set_length_minutes != null) {
      addOption(`${offer.set_length_minutes} minutes`);
    }
  }

  for (const offer of dynamicFeeOffers) {
    if (offer.set_details?.trim()) {
      addOption(offer.set_details);
    } else if (offer.overall_set_length_minutes != null) {
      addOption(`${offer.overall_set_length_minutes} minutes`);
    }
  }

  addOption('Other / discuss with band');

  return options;
}

export type BookingSenderDetails = {
  displayName: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
};

export function resolveBookingSenderDetails(
  user: User,
  profile: UserProfile | null,
  displayName: string,
): BookingSenderDetails {
  return {
    displayName: profile?.display_name?.trim() || displayName,
    username: profile?.username?.trim() || null,
    email: profile?.contact_email?.trim() || user.email?.trim() || null,
    phone: profile?.contact_phone?.trim() || null,
    location: profile?.location?.trim() || null,
  };
}

function formatDisplayTime(timeValue: string): string {
  const [hours, minutes] = timeValue.split(':');
  if (hours == null || minutes == null) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBudgetLabel(budget: string): string {
  const trimmed = budget.trim();
  if (!trimmed) {
    return 'Not specified';
  }

  const amount = Number(trimmed);
  if (Number.isFinite(amount)) {
    return `£${amount.toLocaleString('en-GB')}`;
  }

  return trimmed;
}

export function formatBookingVenueSummary(venue: OrganiserVenue): string {
  const location = formatOrganiserVenueLocation(venue);
  const typeLabel = venue.venue_type ? formatOrganiserVenueType(venue.venue_type) : null;

  if (location && typeLabel) {
    return `${venue.name}, ${location} (${typeLabel})`;
  }
  if (location) {
    return `${venue.name}, ${location}`;
  }
  if (typeLabel) {
    return `${venue.name} (${typeLabel})`;
  }
  return venue.name;
}

export function formatBookingVenueMessageLines(venue: OrganiserVenue): string[] {
  const lines = [`Venue: ${venue.name}`];

  if (venue.venue_type) {
    lines.push(`Type: ${formatOrganiserVenueType(venue.venue_type)}`);
  }

  const address = formatOrganiserVenueAddress(venue);
  if (address) {
    lines.push(`Address: ${address}`);
  }

  if (venue.capacity != null) {
    lines.push(`Capacity: ${venue.capacity}`);
  }

  const contactParts = [venue.contact_name, venue.contact_email, venue.contact_phone]
    .map((part) => part?.trim())
    .filter(Boolean) as string[];

  if (contactParts.length) {
    lines.push(`Venue contact: ${contactParts.join(' · ')}`);
  }

  if (venue.notes?.trim()) {
    lines.push(`Venue notes: ${venue.notes.trim()}`);
  }

  return lines;
}

export function composeBookingEnquiryMessage(
  bandName: string,
  values: BookingEnquiryFormValues,
  sender: BookingSenderDetails,
  selectedVenue?: OrganiserVenue | null,
): string {
  const lines = [`Booking enquiry for ${bandName}`, ''];

  lines.push('From');
  lines.push(`Name: ${sender.displayName}`);
  if (sender.username) {
    lines.push(`Bandie: @${sender.username}`);
  }
  if (sender.email) {
    lines.push(`Email: ${sender.email}`);
  }
  if (sender.phone) {
    lines.push(`Phone: ${sender.phone}`);
  }
  if (sender.location) {
    lines.push(`Location: ${sender.location}`);
  }

  lines.push('');
  lines.push('Event details');
  lines.push(`Date: ${formatDisplayDate(values.eventDate)}`);
  lines.push(`Time: ${values.eventTime.trim() ? formatDisplayTime(values.eventTime) : 'To be confirmed'}`);
  lines.push(`Set duration: ${values.setDuration}`);

  if (selectedVenue) {
    lines.push(...formatBookingVenueMessageLines(selectedVenue));
  } else {
    lines.push(`Venue: ${values.venue.trim()}`);
  }

  lines.push(`Budget: ${formatBudgetLabel(values.budget)}`);

  const notes = values.additionalNotes.trim();
  if (notes) {
    lines.push('');
    lines.push('Additional notes');
    lines.push(notes);
  }

  return lines.join('\n');
}

export function isBookingEnquiryFormValid(values: BookingEnquiryFormValues): boolean {
  return Boolean(values.eventDate.trim() && values.setDuration.trim() && values.venue.trim());
}
