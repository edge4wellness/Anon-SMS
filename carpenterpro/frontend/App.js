import React, { useState } from 'react';
import { localCache } from './src/database/localCache';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TemplateSelector from './src/screens/TemplateSelector';
import EstimatorDashboard from './src/screens/EstimatorDashboard';

const SCREEN = {
  ONBOARDING: 'onboarding',
  TEMPLATE_SELECT: 'template_select',
  ESTIMATOR: 'estimator',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.ONBOARDING);
  const [authToken, setAuthToken] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  function handleOnboardingNext({ bizName, zip }) {
    const userId = `USR-${Date.now()}`;
    localCache.convertToPermanentUser(userId, `${userId}@local`, bizName, zip);
    setAuthToken(userId);
    setScreen(SCREEN.TEMPLATE_SELECT);
  }

  function handleTemplateSelected(template) {
    const now = new Date().toISOString();
    const project = {
      project_id: `PRJ-${Date.now()}`,
      user_id: localCache.getSaveState().user.user_id,
      customer_name: null,
      customer_address: null,
      project_type: template.title,
      status: 'draft',
      total_materials_cost: 0,
      total_labor_cost: 0,
      markup_percent: 20,
      total_bid: 0,
      created_at: now,
      last_modified_at: now,
    };
    localCache.saveProjectOffline(
      project,
      template.sections ?? [],
      template.materials ?? [],
      template.labor ?? []
    );
    setActiveProject(project);
    setScreen(SCREEN.ESTIMATOR);
  }

  if (screen === SCREEN.ONBOARDING) {
    return <OnboardingScreen onNext={handleOnboardingNext} />;
  }

  if (screen === SCREEN.TEMPLATE_SELECT) {
    return (
      <TemplateSelector
        onSelect={handleTemplateSelected}
      />
    );
  }

  if (screen === SCREEN.ESTIMATOR) {
    return (
      <EstimatorDashboard
        project={activeProject}
        authToken={authToken}
        onBack={() => setScreen(SCREEN.TEMPLATE_SELECT)}
      />
    );
  }

  return null;
}
