import { IshikawaGame } from '@/src/components/IshikawaGame'

export default function IshikawaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ishikawa Diagram</h1>
        <p className="text-gray-600">Root cause analysis training</p>
      </div>
      <IshikawaGame onComplete={() => {}} />
    </div>
  )
}
