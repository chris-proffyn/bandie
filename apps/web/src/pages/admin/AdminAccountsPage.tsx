import { useState } from 'react';
import {
  searchAdminBands,
  searchAdminUsers,
  type AdminSearchBand,
  type AdminSearchUser,
} from '@bandie/data';
import { AdminOrganiserInvitesPanel } from '../../components/admin/AdminOrganiserInvitesPanel';

export function AdminAccountsPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminSearchUser[]>([]);
  const [bands, setBands] = useState<AdminSearchBand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const [userRows, bandRows] = await Promise.all([
        searchAdminUsers(query),
        searchAdminBands(query),
      ]);
      setUsers(userRows);
      setBands(bandRows);
    } catch (err) {
      setUsers([]);
      setBands([]);
      setError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-main">
      <section className="panel">
        <p className="my-bands-eyebrow">Accounts</p>
        <h2>User, band and organiser search</h2>
        <form className="admin-search-bar" onSubmit={handleSearch}>
          <div className="auth-field">
            <label htmlFor="adminAccountSearch">Search</label>
            <input
              id="adminAccountSearch"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, username, email, band…"
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      </section>

      <section className="panel">
        <h3>Users</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.display_name ?? '—'}</td>
                <td>{user.username ?? '—'}</td>
                <td>{user.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h3>Bands</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((band) => (
              <tr key={band.band_id}>
                <td>{band.name}</td>
                <td>{band.slug}</td>
                <td>{band.owner_display_name ?? band.owner_user_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AdminOrganiserInvitesPanel />
    </div>
  );
}
