import React, { useState, useEffect } from 'react';
import { AppProvider, useApp, useAuth } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackendReportModal } from './components/BackendReportModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { HelpModal } from './components/HelpModal';
import { Home } from './pages/Home';
import { ExploreProjects } from './pages/ExploreProjects';
import { ProjectDetails } from './pages/ProjectDetails';
import { MyGroupProject } from './pages/MyGroupProject';
import { SubmitProject } from './pages/SubmitProject';
import { SignInPage } from './pages/SignIn';
import { Project } from './types';
import { CheckCircle2, X, Bookmark } from 'lucide-react';

function AppContent() {
  const { refreshProjects } = useApp();
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedProject, setSelectedProject] = useState<Project | any | null>(null);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [groupForSubmit, setGroupForSubmit] = useState<any | null>(null);
  const [initialDepartment, setInitialDepartment] = useState<string>('');

  // Wishlist and profile tab routing
  const [profileTab, setProfileTab] = useState<'projects' | 'wishlist'>('projects');
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);

  // Modals state
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleUrlSync = () => {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      const tab = params.get('tab');
      if (path === '/profile' || tab === 'wishlist' || tab === 'projects') {
        setActivePage('my-projects');
        if (tab === 'wishlist') {
          setProfileTab('wishlist');
        } else {
          setProfileTab('projects');
        }
      }
    };
    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []);

  const handleNavigateWishlist = (projectId?: string) => {
    setToastMessage('Project added to your wishlist.');
    setProfileTab('wishlist');
    if (projectId) {
      setHighlightedProjectId(projectId);
      setTimeout(() => {
        setHighlightedProjectId(null);
      }, 4500);
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.pathname = '/profile';
      url.searchParams.set('tab', 'wishlist');
      window.history.pushState(null, '', url.toString());
    }
    setActivePage('my-projects');
    setSelectedProject(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: string, filterParam?: string) => {
    if (page === 'profile' || page === 'my-projects' || page === 'my-group') {
      if (filterParam === 'tab:wishlist' || filterParam === 'wishlist') {
        setProfileTab('wishlist');
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.pathname = '/profile';
          url.searchParams.set('tab', 'wishlist');
          window.history.pushState(null, '', url.toString());
        }
      } else {
        setProfileTab('projects');
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.pathname = '/profile';
          url.searchParams.set('tab', 'projects');
          window.history.pushState(null, '', url.toString());
        }
      }
      setActivePage('my-projects');
      setSelectedProject(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (filterParam) {
      if (filterParam.startsWith('search:')) {
        setInitialSearchQuery(decodeURIComponent(filterParam.replace('search:', '')));
        setInitialDepartment('');
      } else {
        setInitialDepartment(filterParam);
        setInitialSearchQuery('');
      }
    } else {
      setInitialDepartment('');
      setInitialSearchQuery('');
    }
    if (page === 'submit') {
      setEditingProject(null);
      setGroupForSubmit(null);
    }
    setActivePage(page);
    setSelectedProject(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (project: any) => {
    if (!isAuthenticated) {
      handleNavigate('signin');
      return;
    }
    setSelectedProject(project);
    setActivePage('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartEdit = (projectToEdit?: any, group?: any) => {
    setEditingProject(projectToEdit || null);
    setGroupForSubmit(group || null);
    setActivePage('submit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProjectSuccess = async (savedProject: any) => {
    await refreshProjects();
    setSelectedProject(null);
    setEditingProject(null);
    setGroupForSubmit(null);
    setActivePage('my-projects');
    setToastMessage(`Project "${savedProject.title}" has been published immediately! It is now live in My Projects and Explore Projects.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 7000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC] text-[#19232B]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-[#19232B] text-white p-4 rounded-[4px] border-l-4 border-[#CA0765] shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs flex-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Published &amp; Live Immediately</span>
              </div>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 ml-auto"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-700">
            <button
              onClick={() => {
                setToastMessage(null);
                handleNavigate('my-projects');
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded transition-colors"
            >
              Open My Projects →
            </button>
            <button
              onClick={() => {
                setToastMessage(null);
                handleNavigate('explore');
              }}
              className="px-2.5 py-1 bg-[#CA0765] hover:bg-[#A10550] text-white text-[11px] font-bold rounded transition-colors"
            >
              Explore Catalogue →
            </button>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activePage={selectedProject ? 'explore' : activePage}
        setActivePage={handleNavigate}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenContact={() => {
          const footerElem = document.querySelector('footer');
          if (footerElem) {
            footerElem.scrollIntoView({ behavior: 'smooth' });
          } else {
            setIsHelpOpen(true);
          }
        }}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1">
        {activePage === 'home' && (
          <Home
            onNavigate={handleNavigate}
            onOpenGuidelines={() => setIsGuidelinesOpen(true)}
          />
        )}

        {activePage === 'explore' && (
          <ExploreProjects
            initialDepartment={initialDepartment}
            initialSearch={initialSearchQuery}
            onSelectProject={handleSelectProject}
            onNavigateSubmit={() => handleNavigate('submit')}
            onNavigateSignIn={() => handleNavigate('signin')}
            onNavigateWishlist={handleNavigateWishlist}
          />
        )}

        {activePage === 'details' && selectedProject && (
          <ProjectDetails
            project={selectedProject}
            onBack={() => handleNavigate('explore')}
            onSelectProject={handleSelectProject}
            onEditProject={handleStartEdit}
            onNavigateSignIn={() => handleNavigate('signin')}
            onNavigateWishlist={handleNavigateWishlist}
          />
        )}

        {(activePage === 'my-group' || activePage === 'my-projects' || (activePage === 'profile' && isAuthenticated)) && (
          <MyGroupProject
            onSelectProject={handleSelectProject}
            onNavigateSubmit={handleStartEdit}
            onNavigateExplore={() => handleNavigate('explore')}
            onNavigateSignIn={() => handleNavigate('signin')}
            initialTab={profileTab}
            highlightProjectId={highlightedProjectId}
          />
        )}

        {activePage === 'submit' && (
          <SubmitProject
            editingProject={editingProject}
            defaultGroup={groupForSubmit}
            onSuccess={handleProjectSuccess}
            onCancel={() => handleNavigate('home')}
            onNavigateSignIn={() => handleNavigate('signin')}
          />
        )}

        {(activePage === 'signin' || (activePage === 'profile' && !isAuthenticated)) && (
          <SignInPage
            onNavigate={handleNavigate}
            onNavigateWishlist={handleNavigateWishlist}
          />
        )}
      </main>

      {/* KITS Shared Institutional Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Submission Guidelines Modal */}
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
        onNavigateSubmit={() => {
          setIsGuidelinesOpen(false);
          handleNavigate('submit');
        }}
      />

      {/* Help & Contact Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Backend Architecture & SQLite Integration Plan Modal */}
      <BackendReportModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
