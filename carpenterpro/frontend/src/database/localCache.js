// Local on-device SQLite state emulator
let localDatabaseCache = {
    user: { user_id: 'GUEST_USER', business_name: '', region_zip_code: '', subscription_tier: 'free' },
    projects: [],
    sections: [],
    materials: [],
    labor: []
};

export const localCache = {
    getSaveState: () => localDatabaseCache,
    saveProjectOffline: (project, sections, materials, labor) => {
        project.last_modified_at = new Date().toISOString();
        localDatabaseCache.projects = [project];
        localDatabaseCache.sections = sections;
        localDatabaseCache.materials = materials;
        localDatabaseCache.labor = labor;
        console.log("💾 Step saved securely inside the local device cache vault.");
    },
    convertToPermanentUser: (userId, email, businessName, zip) => {
        localCache.user = { user_id: userId, business_name: businessName, region_zip_code: zip, subscription_tier: 'free', email };
        if(localDatabaseCache.projects[0]) {
            localDatabaseCache.projects[0].user_id = userId;
        }
        console.log("👤 Local cache migrated from anonymous guest to account ID: " + userId);
    }
};
