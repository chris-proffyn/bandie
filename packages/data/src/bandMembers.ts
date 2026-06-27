import { getBandieClient } from './context';

export type BandMemberProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  preferred_instrument: string | null;
  profile_image_url: string | null;
  location: string | null;
  instruments: string[];
  bio: string | null;
};

export type BandMemberWithProfile = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profile: BandMemberProfile | null;
};

const memberProfileSelect = `
  id,
  user_id,
  display_name,
  preferred_instrument,
  profile_image_url,
  location,
  instruments,
  bio
`;

export async function listBandMembersWithProfiles(bandId: string): Promise<BandMemberWithProfile[]> {
  const client = getBandieClient();

  const { data: members, error: membersError } = await client
    .from('bandie_band_members')
    .select('id, user_id, role, status, created_at')
    .eq('band_id', bandId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  if (!members?.length) {
    return [];
  }

  const userIds = members.map((member) => member.user_id);
  const { data: profiles, error: profilesError } = await client
    .from('bandie_profiles')
    .select(memberProfileSelect)
    .in('user_id', userIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id,
      {
        ...profile,
        instruments: profile.instruments ?? [],
      } satisfies BandMemberProfile,
    ]),
  );

  return members.map((member) => ({
    ...member,
    profile: profileByUserId.get(member.user_id) ?? null,
  }));
}

export function memberDisplayName(member: BandMemberWithProfile): string {
  if (member.profile?.display_name?.trim()) {
    return member.profile.display_name.trim();
  }
  return 'Band member';
}
