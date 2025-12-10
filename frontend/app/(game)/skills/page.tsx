import { ProgressionDashboard } from "@/components/skills/ProgressionDashboard";
import { SkillTreeViewer } from "@/components/skills/SkillTreeViewer";

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Skill Tree Hub</h2>
        <p className="text-sm text-gray-600">
          Track your Lean mastery, unlock new techniques, and manage your active bonuses.
        </p>
      </div>
      <ProgressionDashboard />
      <SkillTreeViewer />
    </div>
  );
}
