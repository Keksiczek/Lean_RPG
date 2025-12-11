"use client";

import React, { useEffect } from "react";
import type { AuditScene } from "@/types/audit";
import { useAuditStore } from "@/src/store/auditStore";
import { AuditCanvas } from "./AuditCanvas";
import { AuditCategorization } from "./AuditCategorization";
import { AuditResults } from "./AuditResults";
import { AuditSceneSelector } from "./AuditSceneSelector";

interface AuditGameProps {
  scene: AuditScene | null;
  onSelectScene: (scene: AuditScene) => void;
  onComplete: () => void;
}

export const AuditGame: React.FC<AuditGameProps> = ({
  scene,
  onSelectScene,
  onComplete,
}) => {
  const status = useAuditStore((state) => state.status);
  const foundProblems = useAuditStore((state) => state.foundProblems);
  const timeRemaining = useAuditStore((state) => state.timeRemaining);
  const startAudit = useAuditStore((state) => state.startAudit);
  const finishAudit = useAuditStore((state) => state.finishAudit);
  const decrementTime = useAuditStore((state) => state.decrementTime);
  const resetAudit = useAuditStore((state) => state.resetAudit);

  useEffect(() => {
    if (!scene) return;
    startAudit(scene);
  }, [scene, startAudit]);

  useEffect(() => {
    if (status !== "playing") return;

    const interval = setInterval(() => {
      const remaining = decrementTime();
      if (remaining <= 0) {
        finishAudit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, decrementTime, finishAudit]);

  useEffect(() => {
    return () => resetAudit();
  }, [resetAudit]);

  if (!scene) {
    return <AuditSceneSelector onSelectScene={onSelectScene} />;
  }

  if (status === "finished") {
    return (
      <AuditResults
        onNext={() => {
          resetAudit();
          onComplete();
        }}
      />
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="5S audit mini-game">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{scene.name}</h2>
        <div className="text-lg font-semibold">
          Time: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")} /
          {" "}
          {Math.floor(scene.timeLimit / 60)}:{String(scene.timeLimit % 60).padStart(2, "0")}
        </div>
      </div>

      <AuditCanvas scene={scene} foundProblems={foundProblems} />

      <div>
        <h3 className="font-semibold mb-2">
          Found Problems: {foundProblems.length}/{scene.problems.length}
        </h3>
        <div className="bg-blue-50 p-4 rounded">
          {foundProblems.length === 0 ? (
            <p className="text-gray-600">Click on issues in the image to mark them</p>
          ) : (
            <div className="space-y-2">
              {foundProblems.map((id) => (
                <div key={id} className="text-sm text-blue-700">
                  ✓ Problem {id} - select the 5S category below
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {foundProblems.length > 0 && <AuditCategorization scene={scene} />}

      <button
        onClick={() => finishAudit()}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        disabled={status !== "playing"}
      >
        Finish Audit
      </button>
    </div>
  );
};
