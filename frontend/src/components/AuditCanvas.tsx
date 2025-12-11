"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AuditProblem, AuditScene } from "@/types/audit";
import { useAuditStore } from "@/src/store/auditStore";

interface AuditCanvasProps {
  scene: AuditScene;
  foundProblems: string[];
}

const drawProblems = (
  ctx: CanvasRenderingContext2D,
  problems: AuditProblem[],
  foundProblems: string[],
) => {
  problems.forEach((problem) => {
    const isFound = foundProblems.includes(problem.id);

    ctx.beginPath();
    ctx.arc(problem.x, problem.y, problem.radius, 0, Math.PI * 2);
    ctx.strokeStyle = isFound ? "#22c55e" : "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = isFound ? "#22c55e" : "#ef4444";
    ctx.font = "bold 14px Arial";
    ctx.fillText(problem.id, problem.x - 10, problem.y + 5);
  });
};

export const AuditCanvas: React.FC<AuditCanvasProps> = ({ scene, foundProblems }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const toggleProblem = useAuditStore((state) => state.toggleProblem);

  useEffect(() => {
    const img = new Image();
    img.src = scene.imageUrl;
    img.onload = () => setImage(img);
  }, [scene.imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    drawProblems(ctx, scene.problems, foundProblems);
  }, [image, scene.problems, foundProblems]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    for (const problem of scene.problems) {
      const distance = Math.hypot(x - problem.x, y - problem.y);
      if (distance <= problem.radius) {
        toggleProblem(problem.id);
        break;
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair max-w-full h-auto"
      />
      <p className="text-sm text-gray-600">
        Click on problems to mark them. Red = not found, Green = found
      </p>
    </div>
  );
};
