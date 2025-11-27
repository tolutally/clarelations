import { Request, Response } from 'express';
import { google } from 'googleapis';
import { supabase } from '../../lib/supabase';

const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5173/api/gmail/callback';
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

/**
 * Handle Gmail OAuth callback and store tokens
 * GET /api/gmail/callback
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error, state } = req.query;

  if (error) {
    return res.redirect(`/?gmail_auth=error&message=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Gmail OAuth credentials not configured' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('gmail_settings')
      .upsert({
        user_id: 'default', // TODO: Replace with actual user ID from auth
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date,
        connected_at: new Date().toISOString(),
        is_active: true,
      });

    if (dbError) {
      console.error('Error storing tokens:', dbError);
      return res.redirect('/?gmail_auth=error&message=Failed+to+store+credentials');
    }

    console.log('✅ Gmail connected successfully');

    // Redirect to frontend with success
    res.redirect('/?gmail_auth=success');
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`/?gmail_auth=error&message=${encodeURIComponent(error.message)}`);
  }
}
