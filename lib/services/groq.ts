import Groq from 'groq-sdk'
import { z } from 'zod'
import { getEnv, hasGroqEnv } from '@/lib/env'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import type { NormalizedImportRow } from '@/lib/data/imports'

export const PORTFOLIO_ANALYSIS_MODEL = 'llama-3.3-70b-versatile'
export const IMPORT_EXTRACTION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const extractedRowsSchema = z.object({
  rows: z.array(
    z.object({
      fund_name: z.string().nullable().optional(),
      isin: z.string().nullable().optional(),
      transaction_type: z.enum(['buy', 'sell', 'transfer_in', 'transfer_out', 'switch_in', 'switch_out']).nullable().optional(),
      trade_date: z.string().nullable().optional(),
      amount_eur: z.number().nullable().optional(),
      shares: z.number().nullable().optional(),
      nav: z.number().nullable().optional(),
      confidence: z.number().min(0).max(1).nullable().optional(),
      notes: z.string().nullable().optional(),
    })
  ),
})

export async function parseMovementsTextWithGroq(text: string) {
  ensureGroqConfigured()
  const groq = new Groq({ apiKey: getEnv('GROQ_API_KEY') })

  const completion = await groq.chat.completions.create({
    model: IMPORT_EXTRACTION_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Extrae movimientos de fondos indexados por ISIN. Devuelve solo JSON con rows. Usa tipos: buy, sell, transfer_in, transfer_out, switch_in, switch_out. No inventes datos.',
      },
      { role: 'user', content: text },
    ],
  })

  const content = completion.choices[0]?.message.content ?? '{"rows":[]}'
  const parsed = extractedRowsSchema.parse(JSON.parse(content))
  await logAiAnalysis('import_text_parse', { text: text.slice(0, 4000) }, parsed, IMPORT_EXTRACTION_MODEL)
  return parsed.rows as NormalizedImportRow[]
}

export async function parseMovementsImageWithGroq(imageDataUrl: string) {
  ensureGroqConfigured()
  const groq = new Groq({ apiKey: getEnv('GROQ_API_KEY') })

  const completion = await groq.chat.completions.create({
    model: IMPORT_EXTRACTION_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Extrae movimientos de fondos indexados por ISIN desde la imagen. Devuelve solo JSON con rows. No inventes datos ausentes.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Convierte esta imagen de movimientos de MyInvestor a JSON estructurado.' },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
  })

  const content = completion.choices[0]?.message.content ?? '{"rows":[]}'
  const parsed = extractedRowsSchema.parse(JSON.parse(content))
  await logAiAnalysis('import_image_parse', { image_size: imageDataUrl.length }, parsed, IMPORT_EXTRACTION_MODEL)
  return parsed.rows as NormalizedImportRow[]
}

export async function generatePortfolioAnalysis(payload: Record<string, unknown>) {
  ensureGroqConfigured()
  const groq = new Groq({ apiKey: getEnv('GROQ_API_KEY') })
  const completion = await groq.chat.completions.create({
    model: PORTFOLIO_ANALYSIS_MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Eres un analista prudente de carteras de fondos indexados. Devuelve JSON con insights: [{title, description, severity}]. No des asesoramiento personalizado de compra/venta.',
      },
      { role: 'user', content: JSON.stringify(payload) },
    ],
  })

  const output = JSON.parse(completion.choices[0]?.message.content ?? '{"insights":[]}')
  await logAiAnalysis('portfolio_analysis', payload, output, PORTFOLIO_ANALYSIS_MODEL)
  return output
}

async function logAiAnalysis(analysisType: string, input: Record<string, unknown>, output: Record<string, unknown>, model: string) {
  const supabase = createServiceSupabaseClient()
  await supabase.from('ai_analysis_logs').insert({
    analysis_type: analysisType,
    input_payload: input,
    output_payload: output,
    model,
  })
}

function ensureGroqConfigured() {
  if (!hasGroqEnv()) {
    throw new Error('GROQ_API_KEY no esta configurada. La importacion manual, CSV y Excel siguen disponibles.')
  }
}
