export function formatInvitationStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Awaiting response';
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    case 'revoked':
      return 'Revoked';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
}

export function isInvitationAwaitingResponse(status: string): boolean {
  return status === 'pending';
}

export function isResolvedInviteStatus(status: string): boolean {
  return status === 'accepted' || status === 'declined';
}
