import {
  getProjectById,
  getMaterialsForProject,
  getLaborForProject,
  getPendingSyncRows,
  clearSyncedRows,
  upsertProject,
  upsertMaterial,
  upsertLabor,
} from './localCache';

const API_BASE = 'https://api.carpenterpro.com/v1';

/**
 * Synchronizes a locally modified project with the cloud database.
 * Enforces Option A: Protects local data using timestamp reconciliation.
 */
async function syncProjectToCloud(localProject, cloudProjectMirror) {
  const localTimestamp = new Date(localProject.last_modified_at).getTime();
  const cloudTimestamp = new Date(cloudProjectMirror.last_modified_at).getTime();

  // If local changes are newer than what is on the server, update the cloud vault
  if (localTimestamp > cloudTimestamp) {
    console.log(`🚀 Local project ${localProject.project_id} is newer. Syncing to cloud...`);

    const response = await fetch(`${API_BASE}/projects/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: localProject,
        sync_timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      console.log('✅ Cloud sync successful. Local-first vault secured.');
      return true;
    } else {
      console.error('❌ Network push failed. Data safely preserved locally in SQLite cache.');
      return false;
    }
  }

  console.log('🤝 Cloud data is up to date or newer. No sync override required.');
  return false;
}

/**
 * Fetches the cloud mirror for a project so we can compare timestamps.
 */
async function fetchCloudMirror(projectId, authToken) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Iterates all locally-pending projects, fetches their cloud mirrors, and
 * calls syncProjectToCloud for each one that is newer locally.
 */
export async function pushPendingChanges(authToken) {
  const pending = await getPendingSyncRows();
  if (!pending.length) return { pushed: 0 };

  const projectIds = [...new Set(pending.map(r => r.row_id))];
  let pushed = 0;

  await Promise.all(
    projectIds.map(async (pid) => {
      const local = await getProjectById(pid);
      if (!local) return;

      const materials = await getMaterialsForProject(pid);
      const labor = await getLaborForProject(pid);
      const localFull = { ...local, materials, labor };

      // Fetch cloud mirror — treat a missing remote as an empty placeholder
      const cloudMirror = (await fetchCloudMirror(pid, authToken)) ?? {
        last_modified_at: new Date(0).toISOString(),
      };

      const didSync = await syncProjectToCloud(localFull, cloudMirror);
      if (didSync) pushed++;
    })
  );

  await clearSyncedRows(pending.map(r => r.id));
  return { pushed };
}

/**
 * Pull a project from the cloud and merge into local storage.
 * Remote wins only when its last_modified_at is strictly newer than local.
 */
export async function pullProject(projectId, authToken) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) throw new Error(`Pull failed (${res.status})`);

  const remote = await res.json();
  const local = await getProjectById(projectId);

  if (!local || new Date(remote.last_modified_at) > new Date(local.last_modified_at)) {
    await upsertProject(remote);
    await Promise.all((remote.materials ?? []).map(upsertMaterial));
    await Promise.all((remote.labor ?? []).map(upsertLabor));
    return { updated: true };
  }

  return { updated: false };
}
