import { NextResponse } from 'next/server';
import { createRequire } from 'module';
import { extractExercisesFromPDF } from '@/lib/groq';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const require = createRequire(import.meta.url);

export async function POST(request: Request) {
  try {
    const pdfParse = require('pdf-parse');
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // Extract exercises using Groq
    const exercises = await extractExercisesFromPDF(text);

    // Save to Supabase
    const savedExercises = [];
    for (const ex of exercises) {
      const { variations, ...exerciseData } = ex;
      
      const { data: savedEx, error: exError } = await supabase
        .from('exercises')
        .insert({
          ...exerciseData,
          validation_status: 'pending',
        })
        .select()
        .single();

      if (exError) {
        console.error('Error saving exercise:', exError);
        continue;
      }

      if (variations && variations.length > 0) {
        const variationsToSave = variations.map((v: any) => ({
          exercise_id: savedEx.id,
          problem: v.problem,
          correct_answer: v.correct_answer,
          explanation: v.explanation,
        }));

        const { data: savedVars, error: varError } = await supabase
          .from('variations')
          .insert(variationsToSave)
          .select();

        if (!varError && savedVars) {
          // Save hints and work_steps
          for (let i = 0; i < savedVars.length; i++) {
            const v = variations[i];
            const savedVar = savedVars[i];

            if (v.hints && v.hints.length > 0) {
              await supabase.from('hints').insert(
                v.hints.map((h: string, idx: number) => ({
                  variation_id: savedVar.id,
                  hint_text: h,
                  hint_order: idx + 1,
                }))
              );
            }

            if (v.workSteps && v.workSteps.length > 0) {
              await supabase.from('work_steps').insert(
                v.workSteps.map((ws: string, idx: number) => ({
                  variation_id: savedVar.id,
                  step_text: ws,
                  step_order: idx + 1,
                }))
              );
            }
          }
        }
      }
      
      savedExercises.push(savedEx);
    }

    return NextResponse.json({ success: true, count: savedExercises.length, exercises: savedExercises });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
}
