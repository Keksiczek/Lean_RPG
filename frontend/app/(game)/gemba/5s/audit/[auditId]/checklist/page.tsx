'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchAudit, submitFiveSAudit } from '@/lib/api/fiveS';
import type { FiveSAudit, FiveSProblem } from '@/lib/api/fiveS';

const options: { value: 'yes' | 'no' | 'not_sure'; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not_sure', label: 'Not sure' },
];

export default function AuditChecklistPage() {
  const params = useParams();
  const auditId = Number(params?.auditId);
  const router = useRouter();
  const [audit, setAudit] = useState<FiveSAudit | null>(null);
  const [answers, setAnswers] = useState<Record<string, { value: string }[]>>({
    sort: [],
    order: [],
    shine: [],
    standardize: [],
    sustain: [],
  });
  const [problems, setProblems] = useState<FiveSProblem[]>([]);
  const [problemDraft, setProblemDraft] = useState<FiveSProblem>({
    position: '',
    description: '',
    category: 'sort',
    severity: 'medium',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const auditDetail = await fetchAudit(auditId);
        setAudit(auditDetail);
        if (auditDetail.setting) {
          setAnswers({
            sort: auditDetail.setting.sortCriteria.map(() => ({ value: 'yes' })),
            order: auditDetail.setting.orderCriteria.map(() => ({ value: 'yes' })),
            shine: auditDetail.setting.shineCriteria.map(() => ({ value: 'yes' })),
            standardize: auditDetail.setting.standardizeCriteria.map(() => ({ value: 'yes' })),
            sustain: auditDetail.setting.sustainCriteria.map(() => ({ value: 'yes' })),
          });
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    if (auditId) load();
  }, [auditId]);

  const updateAnswer = (phase: string, index: number, value: 'yes' | 'no' | 'not_sure') => {
    setAnswers((prev) => {
      const updated = [...(prev[phase] || [])];
      updated[index] = { value };
      return { ...prev, [phase]: updated };
    });
  };

  const addProblem = () => {
    if (!problemDraft.position || !problemDraft.description) return;
    setProblems((prev) => [...prev, { ...problemDraft }]);
    setProblemDraft({ position: '', description: '', category: 'sort', severity: 'medium' });
  };

  const handleSubmit = async () => {
    try {
      const result = await submitFiveSAudit(auditId, { answers, problems });
      router.push(`/gemba/5s/audit/${result.id}/result`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const renderPhase = (key: string, title: string, questions: any[]) => (
    <Card key={key} title={title} description="Odpověz na otázky">
      <div className="space-y-3">
        {questions.map((q, index) => (
          <div key={q.id} className="space-y-1 rounded-md border border-gray-200 p-3 text-sm">
            <p className="font-semibold text-gray-900">{q.question}</p>
            <p className="text-xs text-gray-600">{q.hint}</p>
            <div className="flex gap-2">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateAnswer(key, index, opt.value)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    answers[key]?.[index]?.value === opt.value ? 'bg-blue-600 text-white' : 'border-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">5S Checklist</h1>
          <p className="text-sm text-gray-600">Audit #{auditId}</p>
        </div>
        <Button onClick={handleSubmit} disabled={!audit}>
          Submit audit
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {audit?.setting ? (
        <div className="space-y-3">
          {renderPhase('sort', 'Sort (Třídění)', audit.setting.sortCriteria)}
          {renderPhase('order', 'Set in Order (Uspořádání)', audit.setting.orderCriteria)}
          {renderPhase('shine', 'Shine (Čistota)', audit.setting.shineCriteria)}
          {renderPhase('standardize', 'Standardize', audit.setting.standardizeCriteria)}
          {renderPhase('sustain', 'Sustain', audit.setting.sustainCriteria)}
        </div>
      ) : (
        <p className="text-sm text-gray-600">Loading checklist...</p>
      )}

      <Card title="Problems" description="Přidej nalezené problémy">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <label className="block text-gray-700">Position</label>
            <input
              value={problemDraft.position}
              onChange={(e) => setProblemDraft({ ...problemDraft, position: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <label className="block text-gray-700">Category</label>
            <select
              value={problemDraft.category}
              onChange={(e) => setProblemDraft({ ...problemDraft, category: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="sort">Sort</option>
              <option value="order">Set in order</option>
              <option value="shine">Shine</option>
              <option value="standardize">Standardize</option>
              <option value="sustain">Sustain</option>
            </select>
            <label className="block text-gray-700">Severity</label>
            <select
              value={problemDraft.severity}
              onChange={(e) => setProblemDraft({ ...problemDraft, severity: e.target.value as any })}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="space-y-2 text-sm">
            <label className="block text-gray-700">Description</label>
            <textarea
              value={problemDraft.description}
              onChange={(e) => setProblemDraft({ ...problemDraft, description: e.target.value })}
              className="h-24 w-full rounded-md border px-3 py-2 text-sm"
            />
            <Button type="button" onClick={addProblem} className="mt-2">
              Add problem
            </Button>
          </div>
        </div>

        {problems.length > 0 && (
          <div className="mt-3 space-y-2 text-sm">
            {problems.map((problem, index) => (
              <div key={index} className="rounded-md border border-gray-200 px-3 py-2">
                <p className="font-semibold">{problem.description}</p>
                <p className="text-xs text-gray-600">
                  {problem.position} · {problem.category} · {problem.severity}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
