import { getPendingSyncRows, getSectionsForProject, clearSyncedRows } from './localCache';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Push all locally-modified sections to the cloud.
 * Uses last-write-wins: the server only applies a row if its updated_at is
 * newer than what the server already has.
 */
export async function pushPendingChanges(authToken) {
  const pending = await getPendingSyncRows();
  if (!pending.length) return { pushed: 0 };

  // Gather unique project IDs from pending section rows
  const projectSectionRows = pending.filter(r => r.table_name === 'project_sections');
  const projectIds = [...new Set(projectSectionRows.map(r => r.row_id))];

  const allSections = (
    await Promise.all(projectIds.map(pid => getSectionsForProject(pid)))
  ).flat();

  if (!allSections.length) {
    await clearSyncedRows(pending.map(r => r.id));
    return { pushed: 0 };
  }

  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ sections: allSections }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sync failed (${res.status}): ${body}`);
  }

  await clearSyncedRows(pending.map(r => r.id));
  const { synced } = await res.json();
  return { pushed: synced };
}

/**
 * Pull the latest sections for a project from the cloud and reconcile with
 * local state using last-write-wins on updated_at.
 */
export async function pullProjectSections(projectId, authToken, upsertSection) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/sections`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) throw new Error(`Pull failed (${res.status})`);

  const remoteSections = await res.json();
  const localSections = await getSectionsForProject(projectId);

  const localMap = Object.fromEntries(localSections.map(s => [s.id, s]));

  let conflictsResolved = 0;
  for (const remote of remoteSections) {
    const local = localMap[remote.id];
    // Remote wins only if it is strictly newer than local
    if (!local || new Date(remote.updated_at) > new Date(local.updated_at)) {
      await upsertSection(remote);
      conflictsResolved++;
    }
  }

  return { pulled: remoteSections.length, conflictsResolved };
}
