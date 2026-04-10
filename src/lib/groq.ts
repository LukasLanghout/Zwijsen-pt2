import Groq from 'groq-sdk';
import { Exercise, ExerciseVariation, GenerateVariationsRequest } from './types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function extractExercisesFromPDF(pdfText: string): Promise<Partial<Exercise>[]> {
  const prompt = `Je bent een expert in Zwijsen wiskundewerkboeken voor Nederlandse basisschool.

Analyseer deze werkboektekst en extraheer ALLE oefeningen.

WERKBOEKTEKST:
${pdfText}

OEFENING-TYPES om te herkennen:
- splits: "Splits 496" → H=4, T=9, E=6
- samenvoegen: "4H + 9T + 6E" → 496
- optellen: "347 + 200 = ?"
- aftrekken: "500 - 73 = ?"
- rij: "100, 200, ___, 400, ___" (stapgrootte detecteren)
- meerkeuze: vraag met 4 opties waarvan 1 correct
- vermenigvuldigen: "6 × 7 = ?"

Geef ALLEEN JSON terug in dit exacte formaat:
{
  "exercises": [
    {
      "title": "Splits getallen tot 1000",
      "description": "Splits het getal in honderdtallen, tientallen en eenheden",
      "exercise_type": "splits",
      "grade_level": "group-4",
      "difficulty": "medium",
      "topic": "Getallen tot 1000",
      "original_problem": "Splits. Schrijf de som op.",
      "estimated_time": 10,
      "variations": [
        {
          "problem": "Splits 763",
          "correct_answer": "H=7, T=6, E=3",
          "explanation": "763 = 700 + 60 + 3",
          "hints": ["Begin met het grootste getal", "700 is 7 honderdtallen"],
          "workSteps": ["7 honderdtallen = 700", "6 tientallen = 60", "3 eenheden = 3", "763 = 700 + 60 + 3"]
        }
      ]
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.exercises || [];
  } catch (error) {
    console.error('Error extracting exercises:', error);
    return [];
  }
}

export async function generateVariations(
  exercise: Partial<Exercise>,
  params: GenerateVariationsRequest
): Promise<Partial<ExerciseVariation>[]> {
  const prompt = `Je bent een wiskundeleraar die variaties maakt op bestaande Zwijsen oefeningen.

ORIGINELE OEFENING:
Type: ${exercise.exercise_type}
Probleem: ${exercise.original_problem}
Moeilijkheid: ${exercise.difficulty}

PARAMETERS VOOR NIEUWE VARIATIES:
- Aantal: ${params.count}
- Gewenste moeilijkheid: ${params.difficulty}
- Maximaal getal: ${params.maxNumber}
- Context: ${params.context || 'geen specifieke context'}

Maak ${params.count} variaties die:
- Hetzelfde oefening-type hebben
- Andere getallen gebruiken (max ${params.maxNumber})
- ${params.difficulty === 'harder' ? 'moeilijker zijn (grotere getallen, meer stappen)' : ''}
- ${params.difficulty === 'easier' ? 'makkelijker zijn (kleinere getallen, ronde getallen)' : ''}
- ${params.context ? 'context gebruiken rond ' + params.context : ''}

Geef ALLEEN JSON terug in dit exacte formaat:
{
  "variations": [
    {
      "problem": "Nieuw probleem",
      "correct_answer": "Nieuw antwoord",
      "explanation": "Uitleg",
      "hints": ["Hint 1", "Hint 2"],
      "workSteps": ["Stap 1", "Stap 2"]
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.variations || [];
  } catch (error) {
    console.error('Error generating variations:', error);
    return [];
  }
}
