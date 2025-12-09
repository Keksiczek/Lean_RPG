interface PromptInput {
  textInput: string | null;
  imageUrl: string | null;
  areaContext: string | null;
}

export function buildGeminiPrompt({ textInput, imageUrl, areaContext }: PromptInput) {
  const descriptionPart = textInput?.trim()
    ? `Popis od operátora:\n${textInput.trim()}`
    : "Popis od operátora chybí.";

  const imagePart = imageUrl?.trim()
    ? `URL fotky: ${imageUrl.trim()} (použij pouze jako kontext, upload zatím není implementován).`
    : "Fotka nebyla přiložena.";

  const areaPart = areaContext?.trim()
    ? `Kontext area (knowledge pack):\n${areaContext.trim()}`
    : "Bez dodatečného kontextu oblasti.";

  return `Jsi lean coach specializovaný na 5S a identifikaci plýtvání ve výrobním závodě.\n` +
    `Vyhodnoť submission operátora a odpověz česky, stručně, v bodech.\n` +
    `Struktura výstupu:\n` +
    `- Feedback: konkrétní zpětná vazba a návrhy na zlepšení (česky)\n` +
    `- Score5S: čísla 0-100 pro Seiri, Seiton, Seiso, Seiketsu, Shitsuke\n` +
    `- RiskLevel: low | medium | high\n\n` +
    `${descriptionPart}\n${imagePart}\n${areaPart}\n\n` +
    `Vrať odpověď jako JSON v Markdown kódu (\`\`\`json ... \`\`\`). Příklad:\n` +
    "```json\n" +
    JSON.stringify(
      {
        feedback:
          "Stručná česky psaná zpětná vazba v bodech...",
        score5s: {
          Seiri: 80,
          Seiton: 70,
          Seiso: 60,
          Seiketsu: 75,
          Shitsuke: 65,
        },
        riskLevel: "medium",
      },
      null,
      2
    ) +
    "\n```";
}
