"use client";

import React from "react";
import type {
  IshikawaCategoryName,
  IshikawaProblem,
} from "@/types/ishikawa";
import { useIshikawaStore } from "@/src/store/ishikawaStore";

const CATEGORIES_6M: IshikawaCategoryName[] = [
  "man",
  "machine",
  "material",
  "method",
  "measurement",
  "environment",
];

const CATEGORIES_8P: IshikawaCategoryName[] = [
  ...CATEGORIES_6M,
  "people",
  "place",
];

const CATEGORY_INFO: Record<
  IshikawaCategoryName,
  { jp: string; en: string; icon: string }
> = {
  man: { jp: "人", en: "Man", icon: "👤" },
  machine: { jp: "機械", en: "Machine", icon: "⚙️" },
  material: { jp: "材料", en: "Material", icon: "📦" },
  method: { jp: "方法", en: "Method", icon: "📋" },
  measurement: { jp: "測定", en: "Measurement", icon: "📏" },
  environment: { jp: "環境", en: "Environment", icon: "🌍" },
  people: { jp: "人間", en: "People", icon: "👥" },
  place: { jp: "場所", en: "Place", icon: "📍" },
};

interface IshikawaDiagramBuilderProps {
  problem: IshikawaProblem;
  onGenerateSolutions: () => void;
  onSubmit: () => void;
}

export const IshikawaDiagramBuilder: React.FC<
  IshikawaDiagramBuilderProps
> = ({ problem, onGenerateSolutions, onSubmit }) => {
  const {
    causes,
    categoryType,
    setCategoryType,
    addCause,
    removeCause,
    solutions,
  } = useIshikawaStore();
  const [newCauseText, setNewCauseText] = React.useState("");
  const [selectedCategory, setSelectedCategory] =
    React.useState<IshikawaCategoryName>("man");

  const categories =
    categoryType === "6M" ? CATEGORIES_6M : CATEGORIES_8P;

  const handleAddCause = () => {
    if (newCauseText.trim()) {
      addCause(selectedCategory, newCauseText.trim());
      setNewCauseText("");
    }
  };

  return (
    <div className="space-y-6" aria-label="Ishikawa diagram builder">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900" aria-live="polite">
          {problem.title}
        </h2>
        <p className="text-gray-600 mt-1">{problem.description}</p>
      </div>

      {/* Category Toggle */}
      <div className="flex gap-2" role="group" aria-label="Category type toggle">
        <button
          onClick={() => setCategoryType("6M")}
          className={`px-4 py-2 rounded font-semibold ${
            categoryType === "6M"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          aria-pressed={categoryType === "6M"}
          aria-label="Use 6M categories"
          type="button"
        >
          6M (Traditional)
        </button>
        <button
          onClick={() => setCategoryType("8P")}
          className={`px-4 py-2 rounded font-semibold ${
            categoryType === "8P"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          aria-pressed={categoryType === "8P"}
          aria-label="Use 8P categories"
          type="button"
        >
          8P (Services)
        </button>
      </div>

      {/* Add Cause Form */}
      <div className="bg-gray-50 p-4 rounded space-y-3" aria-label="Add cause form">
        <h3 className="font-semibold text-gray-900">Add a Root Cause</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2" role="listbox" aria-label="Cause categories">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`p-2 rounded text-center text-sm transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 hover:border-blue-400"
              }`}
              aria-pressed={selectedCategory === cat}
              aria-label={`Select ${CATEGORY_INFO[cat].en} category`}
              type="button"
            >
              <div className="text-lg mb-1" aria-hidden>
                {CATEGORY_INFO[cat].icon}
              </div>
              <div>{CATEGORY_INFO[cat].en}</div>
            </button>
          ))}
        </div>

        <input
          type="text"
          value={newCauseText}
          onChange={(e) => setNewCauseText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCause()}
          placeholder="Describe the cause..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Cause description for ${CATEGORY_INFO[selectedCategory].en}`}
        />

        <button
          onClick={handleAddCause}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          aria-label="Add cause to diagram"
          type="button"
        >
          Add Cause
        </button>
      </div>

      {/* Causes by Category */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">
          Added Causes ({causes.length})
        </h3>

        {categories.map((category) => {
          const categoryCauses = causes.filter((c) => c.category === category);
          return (
            <div
              key={category}
              className="bg-white p-4 rounded border border-gray-200"
              aria-label={`${CATEGORY_INFO[category].en} causes`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl" aria-hidden>
                  {CATEGORY_INFO[category].icon}
                </span>
                <h4 className="font-semibold text-gray-900">
                  {CATEGORY_INFO[category].en}
                </h4>
                <span className="ml-auto text-sm text-gray-600">
                  {categoryCauses.length} causes
                </span>
              </div>

              {categoryCauses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No causes added yet for this category
                </p>
              ) : (
                <ul className="space-y-2">
                  {categoryCauses.map((cause) => (
                    <li
                      key={cause.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm text-gray-700">
                        {cause.text}
                      </span>
                      <button
                        onClick={() => removeCause(cause.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-semibold"
                        aria-label={`Remove cause ${cause.text}`}
                        type="button"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2" aria-label="Diagram actions">
        <button
          onClick={onGenerateSolutions}
          disabled={causes.length < 2}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Generate solutions"
          type="button"
        >
          {solutions.length > 0 ? "Regenerate Solutions" : "Generate Solutions"}
        </button>

        {solutions.length > 0 && (
          <button
            onClick={onSubmit}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            aria-label="Submit analysis"
            type="button"
          >
            Submit Analysis
          </button>
        )}
      </div>
    </div>
  );
};
