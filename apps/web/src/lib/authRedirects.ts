const WORKSPACE_DIRECTORY_REDIRECTS: Record<string, string> = {
  '/bands': '/app/bands',
  '/players': '/app/players',
};

export function workspacePathForAuthRedirect(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  const [pathname, search = ''] = path.split('?');
  const workspaceRoot = WORKSPACE_DIRECTORY_REDIRECTS[pathname];

  if (workspaceRoot) {
    return `${workspaceRoot}${search ? `?${search}` : ''}`;
  }

  if (pathname.startsWith('/players/')) {
    return `/app${pathname}${search ? `?${search}` : ''}`;
  }

  return path;
}

export function loginPathForProtectedRoute(pathname: string, search: string): string {
  const redirect = encodeURIComponent(`${pathname}${search}`);
  return `/login?redirect=${redirect}`;
}
