"use client";

import React, { useEffect } from "react";
import type { SubmissionFeedback as FeedbackData } from "@/types/submission";

interface SubmissionFeedbackProps {
  feedback: FeedbackData;
  onNext: () => void;
}

export const SubmissionFeedback: React.FC<SubmissionFeedbackProps> = ({
  feedback,
  onNext,
}) => {
  useEffect(() => {
    triggerConfetti();
  }, []);

  return (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <div className="text-6xl mb-3">✨</div>
        <h2 className="text-3xl font-bold text-gray-900">Analysis Complete!</h2>
      </div>

      <div className="text-center">
        <p className="text-6xl font-bold text-blue-600">{feedback.score}</p>
        <p className="text-gray-600 text-lg">/100</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${feedback.score}%` }}
        />
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Feedback</h3>
        <p className="text-gray-700 leading-relaxed">{feedback.feedback}</p>
      </div>

      {feedback.improvements && feedback.improvements.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Areas to Improve</h3>
          <ul className="space-y-2">
            {feedback.improvements.map((imp, i) => (
              <li key={`${imp}-${i}`} className="flex items-start text-gray-700">
                <span className="text-orange-500 mr-2">•</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
        <p className="text-4xl mb-2">🎉</p>
        <p className="text-2xl font-bold text-yellow-700">+{feedback.xpEarned} XP</p>
      </div>

      {feedback.badgesUnlocked && feedback.badgesUnlocked.length > 0 && (
        <div>
          <p className="font-semibold text-gray-900 mb-3">🏅 Badges Unlocked</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {feedback.badgesUnlocked.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg"
              >
                <div className="text-4xl mb-1">{badge.icon}</div>
                <p className="text-xs text-center text-gray-700">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Next Quest
      </button>
    </div>
  );
};

function triggerConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = "position:fixed;top:0;left:0;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }> = [];

  for (let i = 0; i < 50; i += 1) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 8 + 4,
      life: 1,
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      const p = particle;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.02;

      ctx.fillStyle = `hsl(${Math.random() * 60 + 30}, 100%, 50%, ${p.life})`;
      ctx.fillRect(p.x, p.y, 5, 5);
    });

    if (particles.some((p) => p.life > 0)) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  };

  animate();
}
