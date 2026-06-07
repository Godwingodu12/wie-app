'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SideBar from '@/components/home/SideBar';
import { useTheme } from '@/components/home/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import { ProgressBar } from '@/components/connections/ProgressBar';
import { UserDetail } from '@/components/connections/UserDetail';
import { TravelDetails } from '@/components/connections/TravelDetails';
import { RelationDetails } from '@/components/connections/RelationDetails';
import { LocationDetails } from '@/components/connections/LocationDetails';
import { BusinessDetails } from '@/components/connections/BusinessDetails';
import { EventsEnjoy } from '@/components/connections/EventsEnjoy';
import { SkillsDetails } from '@/components/connections/SkillsDetails';
import { OutingDetails } from '@/components/connections/OutingDetails';
import { getProfileStatus } from '@/services/connectionService';
import { Loader2 } from 'lucide-react';

type Section =
  | 'user-details'
  | 'travel-details'
  | 'relation-details'
  | 'location-details'
  | 'business-details'
  | 'events-enjoy'
  | 'skills-details'
  | 'outing-details'
  | 'completed';

export default function ConnectionPage() {
  const { isMobile } = useSidebar();
  const { isDark, themeStyles } = useTheme();
  const router = useRouter();
  const marginLeft = isMobile ? '0' : '281px';

  const [currentSection, setCurrentSection] = useState<Section>('user-details');
  const [initialStep, setInitialStep] = useState<number>(1);
  const [progress, setProgress] = useState({ current: 1, total: 7 });
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [ready, setReady] = useState(false);

  // ── On mount: call getProfileStatus to resume from correct step ──
  useEffect(() => {
    (async () => {
      try {
        const status = await getProfileStatus();

        if (!status.success) {
          setReady(true);
          return;
        }

        const faceVerified = status.faceVerified === true;
        setIsFaceVerified(faceVerified);

        if (!status.hasProfile) {
          // No profile yet — start from step 1
          setCurrentSection('user-details');
          setInitialStep(1);
          setProgress({ current: 1, total: 7 });
        } else if (status.resumeSection === 'purpose-selection' || status.isComplete) {
          // All user-detail steps done — go to purpose sections
          setCurrentSection('travel-details');
          setProgress({ current: 1, total: 3 });
        } else {
          // Resume at exact step within user-details
          const safeStep = (!faceVerified && (status.resumeStep ?? 1) >= 3)
            ? 2
            : Math.max(1, Math.min(status.resumeStep ?? 1, 7));

          setCurrentSection('user-details');
          setInitialStep(safeStep);
          setProgress({ current: safeStep, total: 7 });
        }
      } catch (err) {
        console.error('[ConnectionPage] Failed to load profile status:', err);
        // Default to step 1 on error
        setCurrentSection('user-details');
        setInitialStep(1);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const handleProgress = React.useCallback((current: number, total: number) => {
    setProgress({ current, total });
  }, []);

  const handleUserDetailComplete = React.useCallback(() => {
    setCurrentSection('travel-details');
    setProgress({ current: 1, total: 3 });
  }, []);

  const handleTravelDetailComplete = React.useCallback(() => {
    setCurrentSection('relation-details');
    setProgress({ current: 1, total: 3 });
  }, []);
  const handleTravelBack = React.useCallback(() => {
    setCurrentSection('user-details');
    setInitialStep(7);
    setProgress({ current: 7, total: 7 });
  }, []);

  const handleRelationDetailComplete = React.useCallback(() => {
    setCurrentSection('location-details');
    setProgress({ current: 1, total: 3 });
  }, []);
  const handleRelationBack = React.useCallback(() => {
    setCurrentSection('travel-details');
    setProgress({ current: 3, total: 3 });
  }, []);

  const handleLocationDetailComplete = React.useCallback(() => {
    setCurrentSection('business-details');
    setProgress({ current: 1, total: 7 });
  }, []);
  const handleLocationBack = React.useCallback(() => {
    setCurrentSection('relation-details');
    setProgress({ current: 3, total: 3 });
  }, []);

  const handleBusinessDetailComplete = React.useCallback(() => {
    setCurrentSection('events-enjoy');
    setProgress({ current: 1, total: 1 });
  }, []);
  const handleBusinessBack = React.useCallback(() => {
    setCurrentSection('location-details');
    setProgress({ current: 3, total: 3 });
  }, []);

  const handleEventsEnjoyComplete = React.useCallback(() => {
    setCurrentSection('skills-details');
    setProgress({ current: 1, total: 2 });
  }, []);
  const handleEventsEnjoyBack = React.useCallback(() => {
    setCurrentSection('business-details');
    setProgress({ current: 7, total: 7 });
  }, []);

  const handleSkillsDetailComplete = React.useCallback(() => {
    setCurrentSection('outing-details');
    setProgress({ current: 1, total: 2 });
  }, []);
  const handleSkillsBack = React.useCallback(() => {
    setCurrentSection('events-enjoy');
    setProgress({ current: 1, total: 1 });
  }, []);

  const handleOutingDetailComplete = React.useCallback(() => {
    setCurrentSection('completed');
  }, []);
  const handleOutingBack = React.useCallback(() => {
    setCurrentSection('skills-details');
    setProgress({ current: 2, total: 2 });
  }, []);

  // Show spinner while loading profile status
  if (!ready) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: themeStyles.background }}
      >
        <SideBar />
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#8860D9]" />
          <p style={{ color: themeStyles.textSecondary ?? '#888' }} className="text-sm">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-y-auto scrollbar-hide font-sans selection:bg-[#8860D9] selection:text-white"
      style={{ backgroundColor: themeStyles.background, color: themeStyles.text }}
    >
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <SideBar />

      <main
        className="transition-all duration-300 ease-in-out min-h-screen py-8"
        style={{ marginLeft }}
      >
        <div className="w-full mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {currentSection !== 'completed' && (
              <ProgressBar currentStep={progress.current} totalSteps={progress.total} />
            )}
          </div>

          {currentSection === 'user-details' && (
            <UserDetail
              key={initialStep}           // re-mount when step changes via resume
              initialStep={initialStep}
              isFaceVerified={isFaceVerified}
              onProgress={handleProgress}
              onComplete={handleUserDetailComplete}
            />
          )}
          {currentSection === 'travel-details' && (
            <TravelDetails
              onProgress={handleProgress}
              onComplete={handleTravelDetailComplete}
              onBack={handleTravelBack}
            />
          )}
          {currentSection === 'relation-details' && (
            <RelationDetails
              onProgress={handleProgress}
              onComplete={handleRelationDetailComplete}
              onBack={handleRelationBack}
            />
          )}
          {currentSection === 'location-details' && (
            <LocationDetails
              onProgress={handleProgress}
              onComplete={handleLocationDetailComplete}
              onBack={handleLocationBack}
            />
          )}
          {currentSection === 'business-details' && (
            <BusinessDetails
              onProgress={handleProgress}
              onComplete={handleBusinessDetailComplete}
              onBack={handleBusinessBack}
            />
          )}
          {currentSection === 'events-enjoy' && (
            <EventsEnjoy
              onProgress={handleProgress}
              onComplete={handleEventsEnjoyComplete}
              onBack={handleEventsEnjoyBack}
            />
          )}
          {currentSection === 'skills-details' && (
            <SkillsDetails
              onProgress={handleProgress}
              onComplete={handleSkillsDetailComplete}
              onBack={handleSkillsBack}
            />
          )}
          {currentSection === 'outing-details' && (
            <OutingDetails
              onProgress={handleProgress}
              onComplete={handleOutingDetailComplete}
              onBack={handleOutingBack}
            />
          )}

          {currentSection === 'completed' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                Profile Setup Complete!
              </h2>
              <p className={`max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You're all set to start connecting.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => { setCurrentSection('user-details'); setInitialStep(1); }}
                  className={`w-full md:w-[242px] h-[48px] rounded-[25px] border border-[#9575CD] font-medium transition-colors p-[8px_12px] ${isDark ? 'text-white hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Edit Details
                </button>
                <button
                  onClick={() => router.push('/home')}
                  className="w-full md:w-[242px] h-[48px] rounded-[25px] bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center p-[8px_12px]"
                >
                  Go to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
