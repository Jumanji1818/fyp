import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DesktopTitleBar } from './components/common/DesktopTitleBar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { StillThereModal } from './components/shell/StillThereModal';
import { CelebrationModal } from './components/common/CelebrationModal';
import { SplashScreen } from './components/launch/SplashScreen';
import { WelcomeWizard } from './components/launch/WelcomeWizard';
import { OrganizationSetupPage } from './components/launch/OrganizationSetupPage';
import { SignInScreen } from './components/auth/SignInScreen';
import { OrganizationRegisterModal } from './components/auth/OrganizationRegisterModal';
import { MustChangePasswordModal } from './components/auth/MustChangePasswordModal';
import { VendorRegisterModal } from './components/auth/VendorRegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { ProcurementProcessWalkthroughModal } from './components/common/ProcurementProcessWalkthroughModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Sidebar } from './components/shell/Sidebar';
import { TopBar } from './components/shell/TopBar';

// Modules
import { RoleDashboard } from './components/dashboards/RoleDashboard';
import { RequestsModule } from './components/requests/RequestsModule';
import { DepartmentApprovalsModule } from './components/requests/DepartmentApprovalsModule';
import { TendersModule } from './components/tenders/TendersModule';
import { VendorPortalModule } from './components/vendor/VendorPortalModule';
import { EvaluationModule } from './components/evaluation/EvaluationModule';
import { PurchaseOrdersModule } from './components/orders/PurchaseOrdersModule';
import { StoreReceivingModule } from './components/deliveries/StoreReceivingModule';
import { PaymentsModule } from './components/payments/PaymentsModule';
import { VendorsDirectoryModule } from './components/vendors_directory/VendorsDirectoryModule';
import { BudgetsModule } from './components/budgets/BudgetsModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { UserManagementModule } from './components/admin/UserManagementModule';
import { CategoriesModule } from './components/admin/CategoriesModule';
import { AuditLogModule } from './components/admin/AuditLogModule';
import { SettingsModule } from './components/settings/SettingsModule';

const MainApp: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    toggleTheme,
    settings,
    celebrationOpen,
    setCelebrationOpen,
  } = useApp();

  // App launch state (fast load, only once per session)
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('procura_splash_done');
  });
  const [authView, setAuthView] = useState<'signin' | 'welcome' | 'org_setup'>('welcome');

  // Modals for auth & features
  const [orgRegisterOpen, setOrgRegisterOpen] = useState(false);
  const [vendorRegisterOpen, setVendorRegisterOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (currentUser?.role === 'Vendor') return 'vendor_dashboard';
    return 'dashboard';
  });
  const [navItemId, setNavItemId] = useState<string | undefined>(undefined);

  // Sync tab when switching role (e.g. if switching to Vendor)
  useEffect(() => {
    if (currentUser?.role === 'Vendor') {
      if (
        currentTab === 'dashboard' ||
        currentTab === 'requests' ||
        currentTab === 'approvals' ||
        currentTab === 'users'
      ) {
        setCurrentTab('vendor_dashboard');
      }
    } else {
      if (currentTab.startsWith('vendor_')) {
        setCurrentTab('dashboard');
      }
    }
  }, [currentUser?.role]);

  // Global Keyboard Shortcuts (Section 5: Ctrl+K, Ctrl+N, Ctrl+Shift+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K -> Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      // Ctrl+Shift+L -> Toggle Theme
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleTheme();
      }
      // Ctrl+N -> Main new action
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        if (currentUser?.role === 'Request Officer') {
          setCurrentTab('requests');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, currentUser?.role]);

  // Navigation callback from search or deep link
  const handleNavigate = (tab: string, itemId?: string) => {
    setCurrentTab(tab);
    setNavItemId(itemId);
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full max-w-full overflow-hidden bg-[#07130E] text-[#F2EFE6] select-none font-sans">
      {/* Frameless Desktop Custom Title Bar (Section 5) */}
      <DesktopTitleBar />

      {/* Splash Screen on startup */}
      {showSplash && (
        <SplashScreen
          onComplete={() => {
            setShowSplash(false);
            sessionStorage.setItem('procura_splash_done', 'true');
          }}
        />
      )}

      {/* Main Flow */}
   {!isAuthenticated ? (
        authView === 'welcome' ? (
          <WelcomeWizard
            onGoToSignIn={() => setAuthView('signin')}
            onGoToVendorRegister={() => setVendorRegisterOpen(true)}
            onFinishSetup={() => setAuthView('signin')}
            onSetupOrganization={() => setAuthView('org_setup')}
          />
        ) : authView === 'org_setup' ? (
          <OrganizationSetupPage
            onBack={() => setAuthView('welcome')}
            onComplete={() => setAuthView('signin')}
          />
        ) : (
          <SignInScreen
            onSuccess={() => {}}
            onOpenOrgRegister={() => setOrgRegisterOpen(true)}
            onOpenVendorRegister={() => setVendorRegisterOpen(true)}
            onOpenForgotPassword={() => setForgotPasswordOpen(true)}
            onGoToWelcome={() => setAuthView('welcome')}
          />
        )
      ) : (
        /* Authenticated Application Shell (Section 5) */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar (260px collapsible to 72px) */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tabId) => {
              setCurrentTab(tabId);
              setNavItemId(undefined);
            }}
          />

          {/* Right Main Body */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#07130E]">
            {/* Top Bar (Breadcrumb, Search, Notifications) */}
            <TopBar
              currentTab={currentTab}
              onOpenSearch={() => setSearchModalOpen(true)}
              onNavigateTab={handleNavigate}
              onOpenWalkthrough={() => setWalkthroughOpen(true)}
            />

            {/* Scrollable Content Area (max-w-1400px comfortable padding, Section 5) */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
                {/* Router */}
                {currentTab === 'dashboard' && (
                  <RoleDashboard
                    onNavigate={handleNavigate}
                    onOpenNewRequest={() => setCurrentTab('requests')}
                    onOpenWalkthrough={() => setWalkthroughOpen(true)}
                  />
                )}

                {currentTab === 'vendor_dashboard' && (
                  <RoleDashboard
                    onNavigate={handleNavigate}
                    onOpenNewRequest={() => {}}
                    onOpenWalkthrough={() => setWalkthroughOpen(true)}
                  />
                )}

                {currentTab === 'requests' && (
                  <RequestsModule
                    initialSelectedId={navItemId}
                    onNavigateTab={handleNavigate}
                  />
                )}

                {currentTab === 'approvals' && <DepartmentApprovalsModule />}

                {currentTab === 'tenders' && (
                  <TendersModule
                    initialSelectedId={navItemId}
                    onNavigateToEvaluation={(tId) => {
                      setCurrentTab('evaluation');
                      setNavItemId(tId);
                    }}
                  />
                )}

                {currentTab === 'vendor_tenders' && (
                  <VendorPortalModule activeView="tenders" onNavigateTab={handleNavigate} />
                )}

                {currentTab === 'vendor_bids' && (
                  <VendorPortalModule activeView="bids" onNavigateTab={handleNavigate} />
                )}

                {currentTab === 'vendor_contracts' && (
                  <VendorPortalModule activeView="contracts" onNavigateTab={handleNavigate} />
                )}

                {currentTab === 'vendor_deliveries' && (
                  <VendorPortalModule activeView="deliveries" onNavigateTab={handleNavigate} />
                )}

                {currentTab === 'vendor_payments' && (
                  <VendorPortalModule activeView="payments" onNavigateTab={handleNavigate} />
                )}

                {currentTab === 'evaluation' && (
                  <EvaluationModule
                    initialTenderId={navItemId}
                    onNavigateToPO={(poId) => handleNavigate('orders', poId)}
                  />
                )}

                {currentTab === 'awards' && (
                  <EvaluationModule
                    initialTenderId={navItemId}
                    onNavigateToPO={(poId) => handleNavigate('orders', poId)}
                  />
                )}

                {currentTab === 'orders' && <PurchaseOrdersModule initialPoId={navItemId} />}

                {currentTab === 'deliveries' && <StoreReceivingModule />}

                {currentTab === 'payments' && <PaymentsModule />}

                {currentTab === 'vendors' && <VendorsDirectoryModule />}

                {currentTab === 'budgets' && <BudgetsModule />}

                {currentTab === 'reports' && <ReportsModule />}

                {currentTab === 'users' && <UserManagementModule />}

                {currentTab === 'categories' && <CategoriesModule />}

                {currentTab === 'audit' && <AuditLogModule />}

                {currentTab === 'settings' && <SettingsModule />}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />

      <StillThereModal />

      <CelebrationModal
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        title="Procurement Cycle Completed!"
        message="The purchase order has been fully delivered, inspected, and 100% disbursed with an official payment voucher."
      />

      {/* Organization Registration Modal */}
      <OrganizationRegisterModal
        isOpen={orgRegisterOpen}
        onClose={() => setOrgRegisterOpen(false)}
        onSuccess={() => setOrgRegisterOpen(false)}
      />

      {/* Mandatory First-Login Password Change Modal */}
      <MustChangePasswordModal />

      <VendorRegisterModal
        isOpen={vendorRegisterOpen}
        onClose={() => setVendorRegisterOpen(false)}
        onRegistered={() => {
          setVendorRegisterOpen(false);
          setCurrentTab('vendor_dashboard');
        }}
      />

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />

      {/* Interactive End-to-End Procurement Process Walkthrough Modal */}
      <ProcurementProcessWalkthroughModal
        isOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        onNavigateTab={handleNavigate}
      />

      {/* Connectivity Status for Mobile & Offline */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
