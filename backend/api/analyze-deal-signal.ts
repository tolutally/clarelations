import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeAndUpdateDealSignal } from '../lib/analyzeSignal';

/**
 * POST /api/analyze-deal-signal
 * Analyzes a deal and updates its signal based on AI analysis
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dealId } = req.body;

    if (!dealId) {
      return res.status(400).json({ error: 'dealId is required' });
    }

    console.log(`📊 Request to analyze deal signal: ${dealId}`);

    const result = await analyzeAndUpdateDealSignal(dealId);

    res.json({
      success: true,
      signal: result.signal,
      rationale: result.rationale,
    });
  } catch (error) {
    console.error('Error analyzing deal signal:', error);
    res.status(500).json({
      error: 'Failed to analyze deal signal',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
