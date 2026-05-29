import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initLocalDB } from './src/database/localCache';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TemplateSelector from './src/screens/TemplateSelector';
import EstimatorDashboard from './src/screens/EstimatorDashboard';

// Navigation states
const SCREEN = {
  LOADING: 'loading',
  ONBOARDING: 'onboarding',
  TEMPLATE_SELECT: 'template_select',
  ESTIMATOR: 'estimator',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LOADING);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    async function boot() {
      await initLocalDB();
      // TODO: restore persisted session from SecureStore
      setScreen(SCREEN.ONBOARDING);
    }
    boot();
  }, []);

  async function handleOnboardingComplete({ zipCode, businessName }) {
    // TODO: POST /users/register and receive a real auth token
    const mockUser = { id: 'local-user', zipCode, businessName };
    setUser(mockUser);
    setAuthToken(mockUser.id);
    setScreen(SCREEN.TEMPLATE_SELECT);
  }

  function handleTemplateSelected(selectedTemplate) {
    const newProject = {
      id: `proj-${Date.now()}`,
      templateId: selectedTemplate.id,
      name: `${selectedTemplate.name} – ${new Date().toLocaleDateString()}`,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    setProject(newProject);
    setTemplate(selectedTemplate);
    setScreen(SCREEN.ESTIMATOR);
  }

  if (screen === SCREEN.LOADING) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  if (screen === SCREEN.ONBOARDING) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (screen === SCREEN.TEMPLATE_SELECT) {
    return (
      <TemplateSelector
        onSelect={handleTemplateSelected}
        onBack={() => setScreen(SCREEN.ONBOARDING)}
      />
    );
  }

  if (screen === SCREEN.ESTIMATOR) {
    return (
      <EstimatorDashboard
        project={project}
        template={template}
        authToken={authToken}
        onBack={() => setScreen(SCREEN.TEMPLATE_SELECT)}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
});
