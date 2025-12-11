'use client';

import React from 'react';
import type { AuditScene } from '@/types/audit';
import { AUDIT_SCENES } from '@/data/auditScenes';

interface AuditSceneSelectorProps {
  onSelectScene: (scene: AuditScene) => void;
}

export const AuditSceneSelector: React.FC<AuditSceneSelectorProps> = ({
  onSelectScene,
}) => {
  return (
    <div className="space-y-6 py-8" role="region" aria-label="5S audit scene selector">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">5S Audit Game</h1>
        <p className="text-gray-600">Choose your difficulty level</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {AUDIT_SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSelectScene(scene)}
            className={`p-6 rounded-lg border-2 transition text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${
              scene.difficulty === 'easy'
                ? 'border-green-400 bg-green-50 hover:bg-green-100'
                : scene.difficulty === 'medium'
                  ? 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100'
                  : 'border-red-400 bg-red-50 hover:bg-red-100'
            }`}
            aria-label={`Select ${scene.difficulty} difficulty: ${scene.name}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {scene.difficulty.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600">{scene.name}</p>
              </div>
              {scene.difficulty === 'easy' && <span className="text-2xl" aria-hidden>⭐</span>}
              {scene.difficulty === 'medium' && <span className="text-2xl" aria-hidden>⭐⭐</span>}
              {scene.difficulty === 'hard' && <span className="text-2xl" aria-hidden>⭐⭐⭐</span>}
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                🎯 <span className="font-semibold">{scene.problems.length} problems</span>
              </p>
              <p>
                ⏱️{' '}
                <span className="font-semibold">
                  {Math.floor(scene.timeLimit / 60)}:{String(scene.timeLimit % 60).padStart(2, '0')} minutes
                </span>
              </p>
            </div>

            <div className="mt-4 text-blue-600 font-semibold">Start →</div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded max-w-2xl mx-auto text-center text-sm text-gray-700">
        💡 <span className="font-semibold">Tip:</span> Start with Easy and work your way up!
      </div>
    </div>
  );
};
