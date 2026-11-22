import React, { useState, useEffect } from 'react';
import { Repertoire, EngineSettings } from './types';
import {
  loadRepertoires,
  saveRepertoires,
  createRepertoire,
  deleteRepertoire,
  restoreDefaultPresets,
  loadEngineSettings,
  saveEngineSettings
} from './utils/storage';
import { Dashboard } from './components/dashboard/Dashboard';
import { RepertoireDetail } from './components/repertoire/RepertoireDetail';
import { LearnView } from './components/learn/LearnView';
import { TrainView } from './components/train/TrainView';
import { NewRepertoireModal } from './components/repertoire/NewRepertoireModal';

export const App: React.FC = () => {
  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'learn' | 'train'>('dashboard');
  const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [engineSettings, setEngineSettings] = useState<EngineSettings>(loadEngineSettings());

  // Load repertoires on startup
  useEffect(() => {
    const list = loadRepertoires();
    setRepertoires(list);
  }, []);

  const reloadRepertoires = () => {
    const list = loadRepertoires();
    setRepertoires(list);
  };

  const selectedRepertoire = repertoires.find(r => r.id === selectedRepId) || null;

  const handleUpdateEngineSettings = (newSettings: EngineSettings) => {
    setEngineSettings(newSettings);
    saveEngineSettings(newSettings);
  };

  const handleCreateRepertoire = (repData: Omit<Repertoire, 'id' | 'createdAt'>) => {
    const created = createRepertoire(repData);
    reloadRepertoires();
    setIsNewModalOpen(false);
    setSelectedRepId(created.id);
    setCurrentView('detail');
  };

  const handleDeleteRepertoire = (id: string) => {
    deleteRepertoire(id);
    reloadRepertoires();
    if (currentView === 'detail' || currentView === 'learn' || currentView === 'train') {
      setCurrentView('dashboard');
      setSelectedRepId(null);
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Restore the 4 default openings (Jobava London, 1d4, Sicilian Kan, King\'s Indian Defense)? This will reload all 4 full courses.')) {
      const restored = restoreDefaultPresets();
      setRepertoires(restored);
      setSelectedRepId(null);
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#131722] text-[#f1f5f9]">
      {/* View 1: Dashboard ("My Repertoire") */}
      {currentView === 'dashboard' && (
        <Dashboard
          repertoires={repertoires}
          onSelectRepertoire={(rep) => {
            setSelectedRepId(rep.id);
            setCurrentView('detail');
          }}
          onOpenNewModal={() => setIsNewModalOpen(true)}
          onQuickLearn={(rep) => {
            setSelectedRepId(rep.id);
            const nextUnlearned = rep.lines.findIndex(l => !l.learned);
            setSelectedLineIndex(nextUnlearned !== -1 ? nextUnlearned : 0);
            setCurrentView('learn');
          }}
          onQuickTrain={(rep) => {
            setSelectedRepId(rep.id);
            setSelectedLineIndex(0);
            setCurrentView('train');
          }}
          onDeleteRepertoire={handleDeleteRepertoire}
          onRestoreDefaults={handleRestoreDefaults}
        />
      )}

      {/* View 2: Repertoire Detail / All Lines */}
      {currentView === 'detail' && selectedRepertoire && (
        <RepertoireDetail
          repertoire={selectedRepertoire}
          onBack={() => {
            reloadRepertoires();
            setCurrentView('dashboard');
          }}
          onStartLearn={(lineIdx = 0) => {
            setSelectedLineIndex(lineIdx);
            setCurrentView('learn');
          }}
          onStartTrain={(lineIdx = 0) => {
            setSelectedLineIndex(lineIdx);
            setCurrentView('train');
          }}
          onDelete={handleDeleteRepertoire}
          onReload={reloadRepertoires}
        />
      )}

      {/* View 3: Learn Mode */}
      {currentView === 'learn' && selectedRepertoire && (
        <LearnView
          repertoire={selectedRepertoire}
          initialLineIndex={selectedLineIndex}
          engineSettings={engineSettings}
          onUpdateEngineSettings={handleUpdateEngineSettings}
          onBack={() => {
            reloadRepertoires();
            setCurrentView('detail');
          }}
        />
      )}

      {/* View 4: Train Mode */}
      {currentView === 'train' && selectedRepertoire && (
        <TrainView
          repertoire={selectedRepertoire}
          onBack={() => {
            reloadRepertoires();
            setCurrentView('detail');
          }}
          onUpdateRepertoire={reloadRepertoires}
          boardSize={engineSettings.boardSize}
        />
      )}

      {/* New Repertoire Modal */}
      {isNewModalOpen && (
        <NewRepertoireModal
          onClose={() => setIsNewModalOpen(false)}
          onCreate={handleCreateRepertoire}
          defaultMascotIndex={repertoires.length % 10}
        />
      )}
    </div>
  );
};
