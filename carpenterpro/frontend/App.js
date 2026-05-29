import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initLocalDB } from './src/database/localCache';
import OnboardingScreen from './src/screens/OnboardingScreen';
import TemplateSelector from './src/screens/TemplateSelector';
import EstimatorDashboard from './src/screens/EstimatorDashboard';

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
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    async function boot() {
      await initLocalDB();
      // TODO: restore persisted session from SecureStore
      setScreen(SCREEN.ONBOARDING);
    }
    boot();
  }, []);

  async function handleOnboardingComplete({ zipCode, businessName }) {
    // TODO: POST /users/register → receive real JWT
    const userId = `USR-${Date.now()}`;
    const now = new Date().toISOString();
    const newUser = {
      user_id: userId,
      business_name: businessName,
      email: `${userId}@local`,
      region_zip_code: zipCode,
      created_at: now,
      subscription_tier: 'free',
      default_markup_percent: 20.0,
    };
    setUser(newUser);
    setAuthToken(userId);
    setScreen(SCREEN.TEMPLATE_SELECT);
  }

  function handleTemplateSelected(template) {
    const now = new Date().toISOString();
    const project = {
      project_id: `PRJ-${Date.now()}`,
      user_id: user.user_id,
      customer_name: null,
      customer_address: null,
      project_type: template.name,
      status: 'draft',
      total_materials_cost: 0,
      total_labor_cost: 0,
      markup_percent: user.default_markup_percent,
      total_bid: 0,
      created_at: now,
      last_modified_at: now,
      _template: template,
    };
    setActiveProject(project);
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
        project={activeProject}
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
