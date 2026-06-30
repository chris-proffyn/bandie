# Bandie Dropbox Song-Part Storage Integration — Functional and Technical Specification

**Document status:** Draft v1.0  
**Product:** Bandie  
**Feature area:** Song Part Storage / External File Storage Integration  
**External provider:** Dropbox  
**Date:** 29 June 2026  
**Intended audience:** Product, design, engineering, Cursor-based implementation workflows  

---

## 1. Executive Summary

Bandie will integrate with Dropbox as an external storage provider for **song-part files only**. The aim is to keep Bandie’s own storage requirements low by using external applications to hold data-heavy files such as PDFs, lyric sheets, chord charts, tabs, images of handwritten notes and similar song-part assets.

Dropbox is **not** a general-purpose file store for Bandie. It must not be used to store setlists, gig information, rehearsal details, public band media, booking enquiries, calendar data or general band documents. Those objects remain structured Bandie data.

The guiding principle is:

> **Bandie owns the band operating data. Dropbox stores the heavy song-part file bytes.**

Each band leader connects their own Dropbox account. Bandie does not operate a single central Dropbox account. If a leader manages multiple bands, Bandie creates a separate song-part folder for each band inside that leader’s Dropbox account. Within each band folder, Bandie creates and maintains a consistent folder structure for song-part assets.

This allows Bandie to remain lightweight while still providing a structured product experience around songs, parts, readiness, setlists and rehearsals.

---

## 2. Scope

### 2.1 In Scope

The Dropbox integration will support:

- Band leader connecting their own Dropbox account.
- One Dropbox connection per band leader user account.
- One Dropbox song-part storage folder per band.
- A standard folder structure under each band’s Dropbox song-part root.
- Creation of song-specific part folders.
- Uploading song-part files through Bandie into Dropbox.
- Attaching existing Dropbox song-part files to Bandie song parts.
- Storing Dropbox file metadata in Bandie.
- Displaying song-part files in Bandie song folders.
- Previewing or downloading song-part files through Bandie-controlled access.
- Tracking file status, version labels, current/draft/reference states and activity.
- Using file completeness to contribute to part completeness and song readiness.
- Handling disconnected, missing or unavailable Dropbox files gracefully.

### 2.2 Out of Scope

Dropbox will **not** be used for:

- Setlists.
- Gig information.
- Rehearsal information.
- Calendar availability.
- Booking enquiries.
- Public band profiles.
- Band directory content.
- General media library.
- Promotional videos.
- Public profile images.
- General document management.
- Whole-band Dropbox sync.
- Sharing Dropbox folders directly with all band members.
- Allowing band members to browse the band leader’s general Dropbox account.

### 2.3 Explicit Storage Split

| Bandie area | Bandie stores | Dropbox stores |
|---|---|---|
| Band profile | Full structured data | Nothing |
| Band directory | Full structured data | Nothing |
| Band members and roles | Full structured data | Nothing |
| Songs | Song metadata, readiness, notes, part definitions | Nothing directly |
| Song part files | Metadata, status, version, relationship to part | File bytes |
| Setlists | Full structured data | Nothing |
| Gigs | Full structured data | Nothing |
| Rehearsals | Full structured data | Nothing |
| Calendar availability | Full structured data | Nothing |
| Booking enquiries | Full structured data | Nothing |
| Public media | Links/metadata in Bandie or external services | Not Dropbox for MVP |

---

## 3. Product Principles

### 3.1 Bandie Remains the Source of Truth

Bandie must remain the source of truth for:

- Band identity.
- Band membership.
- User permissions.
- Song metadata.
- Song part definitions.
- File-to-part relationships.
- File current/draft/reference state.
- Song readiness.
- Setlist content.
- Gig and rehearsal relationships.
- Activity history.

Dropbox is only the storage location for the actual file bytes associated with song parts.

### 3.2 Dropbox Does Not Control Bandie Permissions

Bandie permissions and Dropbox permissions are separate. A user’s right to see a file inside Bandie must be determined by Bandie membership and role rules, not by whether the user has direct access to the underlying Dropbox folder.

Approved band members should be able to access relevant song-part files through Bandie without needing their own Dropbox access.

### 3.3 Leader-Owned Storage

Each band’s Dropbox song-part storage is connected through a band leader or band admin’s personal Dropbox account.

The UI must make this clear:

> “This band’s song-part storage is connected through Chris Roberts’ Dropbox account.”

### 3.4 External Storage Should Be Replaceable

The design should allow future support for other external storage providers, such as Google Drive, OneDrive or Box. The MVP is Dropbox-only, but the schema and service abstraction should not hard-code Dropbox into all product concepts.

### 3.5 Minimum Necessary Dropbox Access

Bandie should request the minimum Dropbox scopes needed for the chosen MVP. Prefer app-folder access over full Dropbox access unless a future requirement explicitly requires broader browsing.

---

## 4. User Roles and Permissions

### 4.1 Band Leader / Band Admin

A band leader or admin can:

- Connect their Dropbox account.
- Initialise song-part storage for a band.
- Disconnect Dropbox from a band.
- Rebuild standard song-part folders.
- Upload files to any song part.
- Attach Dropbox files to song parts.
- Mark files as current, draft, reference, superseded or archived.
- Remove file attachments from Bandie.
- Optionally delete the underlying Dropbox file, if this capability is later enabled.
- View Dropbox storage health.

### 4.2 Approved Band Member

An approved band member can:

- View song-part files available to members.
- Preview or download files through Bandie.
- Upload files to song parts if their band role allows contribution.
- Attach files to song parts if permitted.
- Mark a file as draft/reference if permitted.
- Request that a file be reviewed or marked current.

Exact member permissions may vary by future role configuration.

### 4.3 Dep / Guest Musician

A dep or guest musician can:

- View only songs, setlists or files explicitly shared with them in Bandie.
- Preview or download files only through Bandie-controlled access.
- Not browse the Dropbox folder.
- Not connect or configure Dropbox.

### 4.4 Public User / Event Organiser

A public user or event organiser has no access to private Dropbox-backed song-part files.

---

## 5. Functional Specification

## 5.1 Connect Dropbox for Song-Part Storage

### Purpose

Allow a band leader to connect their personal Dropbox account so Bandie can store song-part file bytes externally.

### Entry Points

- Band Settings → Integrations → Song Part Storage.
- Band onboarding flow after band creation.
- Song folder page when attempting first file upload and no storage is configured.

### UI Copy

Recommended label:

> **Song Part Storage**  
> Connect Dropbox to store PDFs, tabs, lyric sheets and part files outside Bandie.

The integration panel should show:

- Provider: Dropbox.
- Connected account email.
- Storage owner.
- Band song-parts folder path.
- Status.
- Last checked timestamp.
- Supported use.
- Excluded use.

Example:

```text
Song Part Storage

Provider: Dropbox
Connected account: chris@example.com
Storage owner: Chris Roberts
Band folder: /Bandie/bands/skin-condition/song-parts
Status: Active

Used for:
✓ Song part files
✓ Lyrics, tabs, PDFs and charts

Not used for:
✕ Setlists
✕ Gigs
✕ Rehearsals
✕ Booking enquiries
✕ Public profile media
```

### Behaviour

1. Band leader clicks **Connect Dropbox**.
2. Bandie redirects to Dropbox OAuth.
3. Leader approves requested scopes.
4. Dropbox redirects back to Bandie.
5. Bandie stores encrypted token details against the user integration.
6. Bandie asks whether to initialise song-part storage for the selected band.
7. Bandie creates the band-specific Dropbox folder structure.
8. Bandie records the folder mapping against the band.
9. UI confirms the connection is active.

### Acceptance Criteria

- Only a band leader/admin can connect Dropbox for a band.
- A leader can reuse their Dropbox connection for multiple bands.
- Bandie does not require every band member to connect Dropbox.
- Bandie does not create folders for setlists, gigs, rehearsals or media.
- Bandie clearly states that Dropbox is used only for song-part storage.

---

## 5.2 Initialise Band Song-Part Folder

### Purpose

Create a consistent Dropbox root folder for each band’s song-part assets.

### Folder Pattern

Recommended logical structure:

```text
/Bandie
  /bands
    /{bandSlug}
      /song-parts
```

Depending on Dropbox app-folder behaviour, the actual path may be under Dropbox’s app-specific folder. Bandie should store the actual returned Dropbox path and folder ID.

### Behaviour

When the storage is initialised for a band:

1. Bandie checks the user is the band leader/admin.
2. Bandie checks the user has an active Dropbox integration.
3. Bandie creates the root folder if it does not exist.
4. Bandie stores the Dropbox root path and folder ID.
5. Bandie records an activity event.

### Acceptance Criteria

- Bandie creates a band-specific song-part root folder.
- Bandie stores the Dropbox folder identifier and path.
- Re-running setup is idempotent and should not create duplicate folders.
- Existing valid folder mappings are reused.

---

## 5.3 Create Song Part Folders

### Purpose

When a song is created or when files are first added to a song, Bandie should create the standard Dropbox part folders for that song.

### Standard Folder Structure

```text
/song-parts/{songSlug}
  /lead-guitar
  /rhythm-guitar
  /bass
  /drums
  /vocals
  /shared
```

Future configurable folders may include:

- keys
- backing-vocals
- horns
- sax
- trumpet
- percussion
- violin
- mandolin
- ukulele
- other

### Behaviour

Bandie may create song part folders either:

- Immediately when a song is created.
- Lazily when the first file is uploaded or attached.

Recommended MVP: lazy creation to avoid unnecessary Dropbox folders.

### Acceptance Criteria

- Song folders are created under the band’s song-parts root only.
- Part folder names are generated from Bandie part definitions.
- Folder creation is idempotent.
- If the folder already exists, Bandie links to it rather than creating duplicates.

---

## 5.3a Copy Song to Another Band

### Purpose

Allow a band leader who manages multiple bands to duplicate a song — including part folder structure and Dropbox file bytes — from one band into another without re-uploading files.

### Entry Point

Song folder → **Copy to another band** (band leader only).

### Behaviour

1. Leader selects a target band from other bands they lead (source band excluded).
2. Leader may override the song title; Bandie resolves a unique title and slug on the target band.
3. Bandie verifies the leader owns both bands and that the target band has active Dropbox song-part storage.
4. Both bands must map to the **same** `bandie_user_integrations` Dropbox connection (same leader account).
5. Bandie inserts a new `bandie_songs` row on the target band (metadata copied; `times_played` reset).
6. For each source part folder, Bandie inserts a matching `bandie_song_part_folders` row and creates the Dropbox part folder under the target band path.
7. For each source file with a Dropbox path (not `unavailable`), Bandie calls Dropbox `files/copy_v2` from the source path to the equivalent path under the target band’s song-parts tree, then inserts new `bandie_song_part_files` metadata rows.
8. Bandie recalculates readiness and logs `song_copied` activity.

### Constraints

- Cross-Dropbox-account copy is not supported in MVP.
- Copy counts toward target band song limits when entitlements are enforced (`song.create`).
- Source Dropbox paths must remain under the source band’s configured song-parts root.
- Destination paths must remain under the target band’s configured song-parts root.

### Acceptance Criteria

- New song appears in the target band with independent slug and folder paths.
- Copied files open via Bandie preview/download on the target band.
- No modification to source song or source Dropbox files.
- Clear error when target storage is inactive or Dropbox accounts differ.

---

## 5.4 Upload Song-Part File

### Purpose

Allow approved users to upload a song-part file through Bandie while storing the actual file bytes in Dropbox.

### Entry Point

Song Folder → Part section → Upload Part File.

Examples:

- Song: Dakota.
- Part: Bass.
- File: `dakota-bass-tab.pdf`.

### Behaviour

1. User opens a song folder in Bandie.
2. User selects a part section, such as Bass.
3. User clicks **Upload part file**.
4. User selects file from local device.
5. Bandie validates file type and size.
6. Bandie checks user permission.
7. Bandie ensures Dropbox song-part folder exists.
8. Bandie uploads file bytes to Dropbox.
9. Dropbox returns file metadata.
10. Bandie stores file metadata.
11. Bandie marks file status according to user selection or default.
12. Bandie recalculates part completeness and song readiness.
13. Bandie writes activity event.

### File Status Options

- Current.
- Draft.
- Reference.
- Superseded.
- Archived.

Default status for MVP:

- If no current file exists for that part: `current`.
- If a current file already exists: `draft` or require user choice.

### Acceptance Criteria

- File bytes are not stored in Bandie application storage.
- Bandie stores only metadata and Dropbox identifiers.
- File appears under the correct part section.
- Song readiness updates after upload.
- Activity is logged.

---

## 5.5 Attach Existing Dropbox Song-Part File

### Purpose

Allow a leader or approved member to attach an existing Dropbox file to a Bandie song part, without uploading a new copy.

### MVP Recommendation

For the first version, support this carefully. Do not allow general browsing of the leader’s entire Dropbox. Prefer attaching files only from within the configured band song-parts root.

### Behaviour

1. User clicks **Attach from Dropbox**.
2. Bandie opens a Dropbox picker or Bandie-controlled Dropbox browser scoped to the band song-parts root.
3. User selects a file.
4. Bandie validates that the selected file sits under the allowed band root folder.
5. Bandie stores file metadata against the selected song part.
6. Bandie recalculates completeness/readiness.
7. Bandie logs activity.

### Acceptance Criteria

- Users cannot attach arbitrary Dropbox files outside the band’s configured song-parts root unless explicitly permitted by future admin settings.
- Bandie stores Dropbox file ID, path, rev and metadata.
- Removing the attachment from Bandie does not delete the source Dropbox file by default.

---

## 5.6 Preview or Download Song-Part File

### Purpose

Allow approved Bandie users to access song-part files without exposing Dropbox credentials or refresh tokens.

### Behaviour

1. User clicks a file in Bandie.
2. Bandie checks membership and file visibility.
3. Bandie checks that the Dropbox connection is active.
4. Bandie obtains a temporary link, preview link or download stream from Dropbox.
5. Bandie returns a preview/download response to the frontend.
6. Bandie may log file viewed/downloaded activity.

### UI Behaviour

File actions:

- Preview.
- Download.
- Open source, admin-only or optional.
- Mark current.
- Mark draft/reference.
- Archive.
- Remove from Bandie.

### Acceptance Criteria

- Non-members cannot access files even if they guess a Bandie file URL.
- Dropbox refresh tokens are never sent to the frontend.
- Bandie should prefer temporary or controlled links over permanent public shared links.
- If Dropbox is unavailable, Bandie shows a friendly error.

---

## 5.7 Remove File from Bandie

### Purpose

Allow a file attachment to be removed from a song part.

### MVP Behaviour

Removing a file from Bandie removes the Bandie metadata record or marks it archived. It does **not** delete the underlying Dropbox file.

### Future Option

Admins may later be offered:

- Remove from Bandie only.
- Remove from Bandie and delete from Dropbox.

### Acceptance Criteria

- Default deletion is non-destructive to Dropbox.
- Activity is logged.
- Readiness/completeness is recalculated.
- Superseded files remain auditable if archived instead of hard-deleted.

---

## 5.8 Dropbox Health and Error States

### Health States

Bandie should represent storage health at band level:

- Active.
- Needs reconnect.
- Token expired.
- Folder missing.
- File missing.
- Permission error.
- Provider unavailable.
- Disconnected.

### User Messaging

Example:

> “Dropbox needs reconnecting. Song and setlist data are still available in Bandie, but song-part files cannot be opened until the storage owner reconnects Dropbox.”

### Acceptance Criteria

- Setlists, gigs, rehearsals and songs remain accessible if Dropbox disconnects.
- Only Dropbox-backed song-part files become unavailable.
- Bandie keeps metadata so files can be repaired or reconnected later.

---

## 6. Technical Specification

## 6.1 High-Level Architecture

```text
Frontend
  React / mobile app
      |
      | Bandie API calls
      v
Bandie Backend / API Layer
  Supabase Edge Functions / Node API routes
      |
      | Metadata, permissions, encrypted token references
      v
Bandie Database
      |
      | Server-side Dropbox API calls
      v
Dropbox API
```

### Key Rule

Privileged Dropbox operations must happen server-side. The frontend must never receive Dropbox refresh tokens or long-lived credentials.

---

## 6.2 OAuth Model

### Ownership

Dropbox OAuth tokens are stored against a **Bandie user integration**, not directly against a band. A band-specific storage record then maps a band to the leader’s Dropbox integration.

This supports:

- One leader with multiple bands.
- One Dropbox connection reused across multiple band song-part roots.
- Future transfer of storage ownership.

### OAuth Flow

1. User initiates Dropbox connection.
2. Bandie generates state and PKCE verifier where supported.
3. User is redirected to Dropbox.
4. Dropbox redirects back with authorization code.
5. Bandie exchanges authorization code for access/refresh token.
6. Bandie encrypts and stores token details.
7. Bandie fetches Dropbox account metadata.
8. Bandie marks integration as connected.

### Suggested Dropbox Scopes

For MVP upload/preview/list operations:

```text
account_info.read
files.metadata.read
files.metadata.write
files.content.read
files.content.write
```

Avoid broader sharing scopes unless shared link creation is explicitly required.

---

## 6.3 Database Schema

The following schema assumes Postgres/Supabase-style tables. Adjust naming to match existing Bandie conventions.

### 6.3.1 `bandie_user_integrations`

Stores external account connections owned by a Bandie user.

```sql
create table bandie_user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null check (provider in ('dropbox')),
  provider_account_id text,
  provider_account_email text,

  access_type text not null default 'app_folder',
  encrypted_access_token text,
  encrypted_refresh_token text,
  token_expires_at timestamptz,

  status text not null default 'connected'
    check (status in ('connected', 'needs_reconnect', 'disconnected', 'revoked')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, provider)
);
```

### 6.3.2 `bandie_band_song_part_storage`

Maps a band to the leader-owned Dropbox song-part storage folder.

```sql
create table bandie_band_song_part_storage (
  id uuid primary key default gen_random_uuid(),

  band_id uuid not null references bandie_bands(id) on delete cascade,
  provider text not null check (provider in ('dropbox')),

  integration_id uuid not null references bandie_user_integrations(id) on delete cascade,
  owning_user_id uuid not null references auth.users(id),

  root_folder_path text not null,
  root_folder_id text,

  status text not null default 'active'
    check (status in (
      'active',
      'needs_reconnect',
      'folder_missing',
      'permission_error',
      'disconnected'
    )),

  last_health_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(band_id, provider)
);
```

### 6.3.3 `bandie_song_part_folders`

Represents Bandie’s logical song part folders. These are Bandie objects; Dropbox folders are optional external storage mappings.

```sql
create table bandie_song_part_folders (
  id uuid primary key default gen_random_uuid(),

  band_id uuid not null references bandie_bands(id) on delete cascade,
  song_id uuid not null references bandie_songs(id) on delete cascade,

  part_key text not null,
  part_label text not null,
  sort_order integer not null default 0,
  required_for_readiness boolean not null default true,

  dropbox_folder_id text,
  dropbox_path_lower text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(song_id, part_key)
);
```

### 6.3.4 `bandie_song_part_files`

Stores metadata for files attached to song parts. Actual bytes live in Dropbox.

```sql
create table bandie_song_part_files (
  id uuid primary key default gen_random_uuid(),

  band_id uuid not null references bandie_bands(id) on delete cascade,
  song_id uuid not null references bandie_songs(id) on delete cascade,
  song_part_folder_id uuid not null references bandie_song_part_folders(id) on delete cascade,
  storage_id uuid references bandie_band_song_part_storage(id) on delete set null,

  source text not null check (source in ('dropbox')),
  provider text not null default 'dropbox',

  display_name text not null,
  mime_type text,
  file_size_bytes bigint,

  dropbox_file_id text,
  dropbox_path_lower text,
  dropbox_rev text,
  dropbox_content_hash text,

  status text not null default 'current'
    check (status in ('current', 'draft', 'reference', 'superseded', 'archived', 'unavailable')),

  version_label text,
  visibility text not null default 'band_members'
    check (visibility in ('band_members', 'selected_members', 'setlist_guest')),

  added_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 6.3.5 `bandie_song_part_file_activity`

Tracks song-part file actions.

```sql
create table bandie_song_part_file_activity (
  id uuid primary key default gen_random_uuid(),

  band_id uuid not null references bandie_bands(id) on delete cascade,
  song_id uuid references bandie_songs(id) on delete cascade,
  song_part_folder_id uuid references bandie_song_part_folders(id) on delete set null,
  file_id uuid references bandie_song_part_files(id) on delete set null,

  actor_user_id uuid references auth.users(id),
  action text not null,
  provider text default 'dropbox',
  metadata jsonb not null default '{}',

  created_at timestamptz not null default now()
);
```

---

## 6.4 API Endpoints

The exact route style may be adapted to the selected framework. The following endpoints define required behaviour.

### 6.4.1 Start Dropbox OAuth

```http
GET /api/integrations/dropbox/connect?bandId={bandId}&purpose=song_part_storage
```

Responsibilities:

- Confirm user is authenticated.
- Confirm user is band leader/admin if a `bandId` is supplied.
- Generate OAuth state.
- Store state securely.
- Redirect to Dropbox authorization URL.

---

### 6.4.2 Dropbox OAuth Callback

```http
GET /api/integrations/dropbox/callback?code={code}&state={state}
```

Responsibilities:

- Validate OAuth state.
- Exchange code for token.
- Fetch Dropbox account info.
- Encrypt and store tokens in `bandie_user_integrations`.
- If a band was part of the state, redirect to storage setup.
- Otherwise redirect to user integrations page.

---

### 6.4.3 Initialise Band Song-Part Storage

```http
POST /api/bands/{bandId}/song-part-storage/dropbox/setup
```

Body:

```json
{
  "integrationId": "uuid-of-user-dropbox-integration"
}
```

Responsibilities:

- Confirm user is band leader/admin.
- Confirm integration belongs to current user.
- Create `/Bandie/bands/{bandSlug}/song-parts` if missing.
- Store folder mapping in `bandie_band_song_part_storage`.
- Write activity event.

---

### 6.4.4 Check Storage Health

```http
GET /api/bands/{bandId}/song-part-storage/dropbox/health
```

Responsibilities:

- Confirm user is band member.
- Check storage connection.
- Check token status.
- Optionally verify root folder exists.
- Return health status.

Response example:

```json
{
  "status": "active",
  "provider": "dropbox",
  "storageOwner": "Chris Roberts",
  "providerAccountEmail": "chris@example.com",
  "rootFolderPath": "/Bandie/bands/skin-condition/song-parts",
  "lastHealthCheckAt": "2026-06-29T10:30:00Z"
}
```

---

### 6.4.5 Initialise Song Part Folders

```http
POST /api/bands/{bandId}/songs/{songId}/song-part-storage/init
```

Responsibilities:

- Confirm user can edit song or upload files.
- Ensure band storage exists and is active.
- Create song folder and part folders in Dropbox.
- Store folder IDs/paths against `bandie_song_part_folders`.

---

### 6.4.6 Upload Song-Part File

```http
POST /api/bands/{bandId}/songs/{songId}/parts/{partFolderId}/files
```

Request:

- Multipart file upload.
- Optional status.
- Optional version label.

Responsibilities:

- Confirm user is approved band member.
- Confirm user has upload permission.
- Validate file size and type.
- Ensure Dropbox folder exists.
- Upload file to Dropbox.
- Store file metadata in Bandie.
- Update completeness/readiness.
- Write activity event.

---

### 6.4.7 Attach Existing Dropbox File

```http
POST /api/bands/{bandId}/songs/{songId}/parts/{partFolderId}/files/dropbox/attach
```

Body:

```json
{
  "dropboxFileId": "id:abc123",
  "dropboxPathLower": "/bandie/bands/skin-condition/song-parts/dakota/bass/dakota-bass.pdf",
  "displayName": "Dakota Bass.pdf",
  "mimeType": "application/pdf",
  "fileSizeBytes": 183921,
  "dropboxRev": "015db..."
}
```

Responsibilities:

- Confirm user permission.
- Confirm path sits under the configured band song-parts root.
- Store metadata.
- Update completeness/readiness.
- Write activity event.

---

### 6.4.8 Preview File

```http
GET /api/bands/{bandId}/song-part-files/{fileId}/preview
```

Responsibilities:

- Confirm authenticated user.
- Confirm band membership or explicit guest access.
- Confirm file belongs to band.
- Get temporary Dropbox link or stream file.
- Return preview URL or proxied content.

---

### 6.4.9 Download File

```http
GET /api/bands/{bandId}/song-part-files/{fileId}/download
```

Responsibilities:

- Same permission checks as preview.
- Return controlled download.
- Optionally log download event.

---

### 6.4.10 Update File Status

```http
PATCH /api/bands/{bandId}/song-part-files/{fileId}
```

Body:

```json
{
  "status": "current",
  "versionLabel": "Gig version",
  "visibility": "band_members"
}
```

Responsibilities:

- Confirm user can manage file.
- Update metadata.
- If marking one file current, optionally supersede previous current files for that part.
- Recalculate readiness.
- Log activity.

---

### 6.4.11 Remove File Attachment

```http
DELETE /api/bands/{bandId}/song-part-files/{fileId}
```

MVP behaviour:

- Archive or delete Bandie metadata record.
- Do not delete the underlying Dropbox file.
- Log activity.
- Recalculate readiness.

---

## 6.5 Dropbox Service Abstraction

Implement a provider abstraction rather than spreading Dropbox SDK calls throughout the app.

Example interface:

```ts
export interface ExternalSongPartStorageProvider {
  createFolder(path: string): Promise<ExternalFolder>;
  ensureFolder(path: string): Promise<ExternalFolder>;
  uploadFile(params: UploadExternalFileParams): Promise<ExternalFile>;
  getTemporaryLink(fileIdOrPath: string): Promise<string>;
  getMetadata(fileIdOrPath: string): Promise<ExternalFileMetadata>;
  listFolder(path: string): Promise<ExternalFolderEntry[]>;
}
```

Dropbox implementation:

```ts
export class DropboxSongPartStorageProvider implements ExternalSongPartStorageProvider {
  constructor(private accessToken: string) {}

  async ensureFolder(path: string) {
    // check if folder exists; create if missing
  }

  async uploadFile(params: UploadExternalFileParams) {
    // call Dropbox filesUpload
  }

  async getTemporaryLink(fileIdOrPath: string) {
    // call Dropbox temporary link endpoint or equivalent SDK method
  }
}
```

This makes future Google Drive/OneDrive support easier.

---

## 6.6 File Validation

### Suggested Allowed File Types

MVP allowed types:

- PDF: `application/pdf`.
- Images: `image/jpeg`, `image/png`, `image/webp`.
- Text: `text/plain`, `text/markdown`.
- ChordPro: `.cho`, `.crd`, `.chordpro`.
- Guitar Pro: `.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`, `.gp` where supported.
- Audio reference files may be considered later but should be limited.

### Suggested MVP Size Limits

Recommended defaults:

- PDF/image/text/tab files: 25 MB max.
- Audio reference files, if allowed: 100 MB max.
- Video files: not allowed for MVP.

Bandie should enforce limits before upload where possible.

---

## 6.7 Readiness and Completeness Rules

Song-part files should contribute to Bandie readiness, but Dropbox must not own the readiness calculation.

### Suggested Rules

A part is complete if:

- The part is marked required for readiness.
- At least one current file exists for that part.
- The file is not unavailable.

A song’s file completeness metric can be calculated as:

```text
required parts with current file / total required parts
```

Example:

```text
Song: Dakota
Required parts: vocals, lead guitar, rhythm guitar, bass, drums
Current files present: vocals, bass, drums
Completeness: 3 / 5 = 60%
```

This completeness can feed into the broader song readiness score alongside rehearsal confidence, number of plays, band votes or manual readiness state.

---

## 6.8 Security Requirements

### Token Security

- Store Dropbox access and refresh tokens encrypted at rest.
- Never expose refresh tokens to frontend clients.
- Rotate or refresh access tokens server-side.
- Mark integration as `needs_reconnect` if refresh fails.

### Access Control

Every file operation must check:

- Authenticated user.
- Band membership or explicit guest access.
- Band role permission.
- File belongs to the requested band.
- Song belongs to the requested band.
- Dropbox path sits under the configured band song-parts root.

### Public Links

- Do not create public Dropbox shared links by default.
- Prefer temporary links or server-proxied downloads.
- Public band profiles must not expose private song-part files.

### Path Validation

When attaching Dropbox files, Bandie must reject any file where `dropbox_path_lower` does not start with the configured band song-parts root.

Example:

```ts
function assertPathWithinBandRoot(filePath: string, rootPath: string) {
  const normalisedFilePath = filePath.toLowerCase();
  const normalisedRootPath = rootPath.toLowerCase();

  if (!normalisedFilePath.startsWith(normalisedRootPath + "/")) {
    throw new Error("Dropbox file is outside the configured Bandie song-parts folder");
  }
}
```

---

## 6.9 Row-Level Security Considerations

If using Supabase, RLS should enforce:

- Users can read file metadata only for bands they belong to.
- Users can insert file metadata only for bands they can contribute to.
- Users can update file status only if they have manage-song or manage-file permissions.
- Users cannot read encrypted tokens directly from client-accessible queries.
- Token tables should be accessible only through secure server-side functions.

---

## 6.10 Error Handling

### Error: Dropbox Not Connected

User message:

> “Song-part storage has not been connected for this band yet. A band leader can connect Dropbox from Band Settings.”

### Error: Dropbox Needs Reconnect

User message:

> “Dropbox needs reconnecting. Your Bandie songs and setlists are still available, but song-part files cannot be opened until the storage owner reconnects Dropbox.”

### Error: File Missing in Dropbox

User message:

> “This file could not be found in Dropbox. It may have been moved or deleted outside Bandie.”

### Error: Permission Denied

User message:

> “You do not have access to this song-part file.”

### Error: File Too Large

User message:

> “This file is larger than the allowed upload limit for song-part files.”

---

## 7. Frontend Requirements

## 7.1 Settings Page

Band Settings → Song Part Storage should include:

- Current provider.
- Connected account.
- Storage owner.
- Root folder path.
- Health status.
- Connect/reconnect/disconnect buttons.
- Explanation of what Dropbox is and is not used for.

## 7.2 Song Folder Page

Each song folder should show part sections:

- Lead Guitar.
- Rhythm Guitar.
- Bass.
- Drums.
- Vocals.
- Shared.

Each part section should show:

- Current file.
- Draft/reference files.
- Upload button.
- Attach from Dropbox button, if enabled.
- Missing file indicator.
- Last updated information.

## 7.3 File Card

A file card should show:

- File name.
- File type icon.
- Source: Dropbox.
- Status: current/draft/reference/superseded/archived.
- Added by.
- Added date.
- Version label.
- Actions.

Example:

```text
Dakota Bass Tab.pdf
Source: Dropbox · Status: Current · Added by Chris · 29 Jun 2026
[Preview] [Download] [Mark draft] [Archive]
```

## 7.4 Readiness Indicators

The song folder and song dashboard should be able to show:

- Missing required part files.
- Parts with current files.
- Part completeness percentage.
- Song readiness impact.

Example:

```text
Part files: 4/5 complete
Missing: Rhythm Guitar
```

---

## 8. Migration and Future Extensibility

## 8.1 Storage Ownership Transfer

Future requirement:

- Transfer a band’s song-part storage from one leader’s Dropbox account to another admin’s Dropbox account.

Possible flow:

1. New admin connects Dropbox.
2. Bandie creates new song-parts root.
3. Bandie copies or requests re-upload of files.
4. Bandie remaps file metadata.
5. Old storage is disconnected.

MVP should not build this, but the schema should not prevent it.

## 8.2 Provider Expansion

The architecture should support future providers:

- Google Drive.
- OneDrive.
- Box.
- Bandie native storage.

To support this, keep provider-specific fields either:

- In provider-specific columns for MVP, or
- In a JSON metadata field for future abstraction.

A later refactor could create:

```text
external_storage_connections
external_storage_files
external_storage_provider_metadata
```

For MVP, Dropbox-specific fields are acceptable if kept isolated.

## 8.3 Offline / Performance Mode

Future mobile performance mode may need local caching for setlist files.

Important rule:

- Bandie may cache Dropbox-backed song-part files locally for approved users.
- Access must be revoked when membership is removed, where technically possible.
- Cached files should be encrypted on device if sensitive.

---

## 9. MVP Build Plan

### Phase 1 — Foundation

Build:

- Dropbox app configuration.
- OAuth connect/callback.
- Token storage.
- User integration table.
- Band song-part storage table.
- Settings UI.

### Phase 2 — Band Folder Setup

Build:

- Initialise band song-parts root.
- Store Dropbox folder identifiers.
- Health check endpoint.
- Reconnect flow.

### Phase 3 — Song Part Uploads

Build:

- Song part folder creation.
- Upload to Dropbox.
- Store metadata.
- Show file cards in song folder.
- Activity logging.

### Phase 4 — Preview and Download

Build:

- Permission-controlled preview endpoint.
- Permission-controlled download endpoint.
- Friendly error states.

### Phase 5 — Readiness Integration

Build:

- Part completeness calculation.
- Song readiness contribution.
- Missing part indicators.
- Dashboard metrics.

---

## 10. Acceptance Criteria Summary

### Functional Acceptance Criteria

- A band leader can connect their own Dropbox account.
- A leader can use the same Dropbox account for multiple bands.
- Bandie creates only song-part folders in Dropbox.
- Bandie does not create Dropbox folders for setlists, gigs, rehearsals or media.
- Approved members can upload song-part files through Bandie.
- Approved members can preview/download song-part files through Bandie.
- Public users cannot access private song-part files.
- Setlists, gigs, rehearsals and songs remain available if Dropbox disconnects.
- Dropbox disconnection only affects song-part file access.

### Technical Acceptance Criteria

- Dropbox tokens are stored server-side and encrypted.
- Refresh tokens are never exposed to frontend clients.
- Every file operation checks Bandie permissions.
- Dropbox file paths are validated against the configured band song-parts root.
- File metadata is stored in Bandie.
- File bytes are stored in Dropbox.
- Activity is logged for major file actions.
- Folder setup is idempotent.
- The implementation can later support another external provider.

---

## 11. Cursor Implementation Brief

```md
Build Dropbox integration for Bandie song-part storage only.

Context:
Bandie is a web/mobile platform for amateur bands. Bandie owns structured band data: songs, setlists, gigs, rehearsals, booking enquiries, availability, members, readiness and public profiles. Dropbox is only used to store heavy song-part assets such as PDFs, tabs, lyric sheets, charts and related part files.

Ownership:
Each band leader connects their own Dropbox account. There is no shared Bandie Dropbox account. A leader may have multiple bands, and Bandie creates one song-parts folder per band inside that leader’s Dropbox.

Storage scope:
Dropbox stores file bytes only for song-part files. Bandie stores all metadata, permissions, readiness, status, versioning, comments, review tasks and relationships.

Folder structure:
Create:
/Bandie/bands/{bandSlug}/song-parts/{songSlug}/{partSlug}

Initial part folders:
- lead-guitar
- rhythm-guitar
- bass
- drums
- vocals
- shared

Do not create Dropbox folders for:
- setlists
- gigs
- rehearsals
- media
- bookings
- calendar

Security:
- Store Dropbox tokens server-side only.
- Use Bandie permissions for access.
- Do not expose Dropbox refresh tokens to the frontend.
- Do not grant Dropbox folder access to members automatically.
- Do not create public Dropbox links by default.

Core flows:
1. Band leader connects Dropbox for song-part storage.
2. Bandie initialises the band song-parts folder.
3. Band member uploads or attaches a file to a song part.
4. Bandie stores file metadata and Dropbox identifiers.
5. Bandie recalculates part completeness and song readiness.
6. Band member previews/downloads the file through Bandie-controlled access.

Acceptance criteria:
- Setlists, gigs and rehearsals remain fully stored in Bandie.
- Dropbox is never used as the source of truth for Bandie data.
- Removing a file from Bandie removes or archives the attachment metadata only by default.
- If Dropbox disconnects, Bandie keeps song and setlist data but marks song-part files unavailable.
```

---

## 12. Final Design Principle

The final architecture should be understood as:

```text
Bandie = operating system, metadata, workflow, readiness and permissions.
Dropbox = external file-byte storage for song part assets only.
```

This keeps Bandie lightweight while preserving its core product value: Bandie knows which songs exist, which parts are needed, which files are current, which songs are gig-ready, and how that readiness affects setlists, rehearsals and gigs.
