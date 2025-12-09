"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Quest, UserQuest } from '@/types/quest';

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [userQuest, setUserQuest] = useState<UserQuest | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'submitted' | 'pending' | 'evaluated' | 'error'
  >('idle');
  const [xpGain, setXpGain] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!questId) return;
    const fetchQuest = async () => {
      try {
        const response = await api.get(`/api/quests/${questId}`);
        setQuest(response.data as Quest);
      } catch (err) {
        console.error('Unable to load quest detail', err);
        setError('Nepodařilo se načíst detail úkolu.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuest();
  }, [questId]);

  useEffect(() => {
    return () => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [pollTimer]);

  const handleAccept = async () => {
    if (!questId) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post(`/api/quests/${questId}/accept`);
      setUserQuest(response.data as UserQuest);
      setAccepted(true);
    } catch (err) {
      setError('Nepodařilo se přijmout úkol.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!questId || !submission.trim()) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    if (pollTimer) {
      clearInterval(pollTimer);
      setPollTimer(null);
    }

    try {
      const res = await api.post('/api/submissions', {
        questId: Number(questId),
        content: submission,
      });
      setSubmissionStatus('submitted');
      setMessage('Úkol odeslán ke kontrole!');
      const submissionId = res.data.submissionId;
      const pollStart = Date.now();
      const MAX_POLL_TIME_MS = 30_000;

      const poll = setInterval(async () => {
        try {
          const statusRes = await api.get(`/api/submissions/${submissionId}`);
          const data = statusRes.data;

          if (data.status === 'failed') {
            setSubmissionStatus('error');
            setError(
              data.aiFeedback ||
                'Analýza se nezdařila. Zkuste prosím později nebo kontaktujte podporu.'
            );
            clearInterval(poll);
            setPollTimer(null);
            return;
          }

          if (data.status === 'evaluated') {
            setSubmissionStatus('evaluated');
            setXpGain(data.xpGain ?? null);
            setFeedback(data.aiFeedback ?? null);
            setMessage(`Hotovo! Získali jste ${data.xpGain ?? 0} XP!`);
            clearInterval(poll);
            setPollTimer(null);
            setTimeout(() => router.push('/dashboard'), 1500);
            return;
          }

          const elapsedTime = Date.now() - pollStart;
          if (elapsedTime > MAX_POLL_TIME_MS) {
            setSubmissionStatus('error');
            setError(
              'Analýza trvá déle než obvykle. Vaše řešení bylo uloženo a bude zpracováno na pozadí. Zkontrolujte prosím výsledek později.'
            );
            clearInterval(poll);
            setPollTimer(null);
            return;
          }

          setSubmissionStatus('pending');
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 2000);

      setPollTimer(poll);
    } catch (err) {
      console.error('Unable to submit quest', err);
      setError('Nepodařilo se odeslat řešení. Zkuste to prosím znovu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Načítám detail úkolu...</span>
      </div>
    );
  }

  if (!quest) {
    return (
      <Card title="Úkol nenalezen" description="Zkontrolujte prosím odkaz nebo se vraťte zpět na seznam úkolů.">
        <Link href="/quests" className="text-sm font-medium text-primary hover:underline">
          Zpět na seznam
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Detail questu</p>
          <h1 className="text-2xl font-semibold text-gray-900">{quest.title}</h1>
        </div>
        <Button variant="secondary" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </Button>
      </div>

      <Card>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{quest.baseXp} XP</Badge>
            {quest.leanConcept ? <Badge variant="outline">Lean: {quest.leanConcept}</Badge> : null}
          </div>
          <p className="text-gray-700">{quest.description}</p>
          {quest.briefText ? (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Stručný příběh</p>
              <p className="mt-1 leading-relaxed">{quest.briefText}</p>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Odevzdat řešení" description="Popište své řešení nebo přidejte odkaz na soubor.">
        <div className="space-y-3">
          {!accepted ? (
            <Button onClick={handleAccept} disabled={submitting} className="inline-flex items-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Přijmout úkol
            </Button>
          ) : (
            <>
              <label className="text-sm font-medium text-gray-700" htmlFor="submission">
                Textové řešení
              </label>
              <textarea
                id="submission"
                className="w-full rounded-lg border border-gray-200 p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={6}
                maxLength={5000}
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Popište svůj postup, přínosy nebo přidejte odkaz na soubor."
              />
              <p className="text-sm text-gray-500">{submission.length} / 5000</p>
              {error ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">{error}</p>
                  <Button variant="secondary" onClick={handleSubmit} disabled={submitting}>
                    Zkusit znovu
                  </Button>
                </div>
              ) : null}
              {message ? <p className="text-sm text-green-600">{message}</p> : null}
              {submissionStatus === 'pending' ? (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Zpracovávám vaše řešení... (to může trvat několik sekund)</span>
                </div>
              ) : null}
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitting || !submission.trim()} className="inline-flex items-center gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Odeslat řešení
                </Button>
              </div>
            </>
          )}
          {submissionStatus === 'evaluated' && (
            <Card className="bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-900">Zpětná vazba</h3>
              <p className="text-sm text-green-800 mt-2">{feedback}</p>
              {xpGain !== null ? <Badge className="mt-2">+{xpGain} XP</Badge> : null}
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
