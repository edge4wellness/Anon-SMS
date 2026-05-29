import { localCache } from './localCache';

/**
 * Compares modifications to enforce Local-First Vault rules.
 * Prevents automated cloud synchronization jobs from wiping customized contractor data.
 */
export async function syncProjectToCloud(localProject, cloudProjectMirror) {
    const localTimestamp = new Date(localProject.last_modified_at).getTime();
    const cloudTimestamp = cloudProjectMirror ? new Date(cloudProjectMirror.last_modified_at).getTime() : 0;

    if (localTimestamp > cloudTimestamp) {
        console.log(`⚙️ Local modifications are newer. Initializing server sync pipeline...`);
        try {
            const response = await fetch('http://localhost:3000/v1/projects/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project: localProject, sync_timestamp: new Date().toISOString() })
            });
            const data = await response.json();
            return data.success;
        } catch (err) {
            console.log("📴 Sync connection offline. Bid remains securely stored in local storage cache.");
            return false;
        }
    }
    return false;
}

/**
 * Fetches the cloud mirror for the active project so timestamps can be compared.
 */
async function fetchCloudMirror(projectId, authToken) {
    try {
        const res = await fetch(`http://localhost:3000/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

/**
 * Reads the current local cache state and attempts to sync the active project
 * to the cloud using Local-First Vault timestamp reconciliation.
 */
export async function pushPendingChanges(authToken) {
    const { projects, sections, materials, labor } = localCache.getSaveState();
    const localProject = projects[0];
    if (!localProject) return { pushed: 0 };

    const cloudMirror = await fetchCloudMirror(localProject.project_id, authToken);
    const didSync = await syncProjectToCloud(localProject, cloudMirror);

    return { pushed: didSync ? 1 : 0 };
}
