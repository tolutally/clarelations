import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, Loader2, ShieldAlert } from 'lucide-react';

// Check if an email is allowed to sign in
function isEmailAllowed(email: string): boolean {
  const allowedList = import.meta.env.VITE_ALLOWED_EMAILS || '';
  
  console.log('🔍 Checking email allowlist:', {
    email,
    allowedList,
    isPlaceholder: allowedList === 'your@email.com'
  });
  
  // If no allowlist is configured, allow all (open access)
  if (!allowedList || allowedList === 'your@email.com') {
    console.warn('⚠️ No allowlist configured - allowing all emails. Set VITE_ALLOWED_EMAILS in .env.local to restrict access.');
    return true;
  }
  
  const allowed = allowedList.split(',').map((e: string) => e.trim().toLowerCase());
  const emailLower = email.toLowerCase();
  
  console.log('✅ Allowlist active:', allowed);
  
  // Check for exact email match
  if (allowed.includes(emailLower)) {
    console.log('✅ Email matched exactly');
    return true;
  }
  
  // Check for domain match (e.g., @company.com)
  const emailDomain = '@' + emailLower.split('@')[1];
  if (allowed.some((a: string) => a.startsWith('@') && emailDomain === a)) {
    console.log('✅ Domain matched:', emailDomain);
    return true;
  }
  
  console.log('❌ Email not in allowlist');
  return false;
}

export function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email');
      return;
    }

    // Check if email is allowed
    if (!isEmailAllowed(email)) {
      setMessage('This email is not authorized to access the system. Please contact an administrator.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      
      setMessage('Check your email for the login link!');
      setEmail('');
    } catch (error: any) {
      setMessage(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Clarelations</h1>
          <p className="text-slate-600">Sign in with your email - no password needed</p>
          
          {import.meta.env.VITE_ALLOWED_EMAILS && import.meta.env.VITE_ALLOWED_EMAILS !== 'your@email.com' && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200">
              <ShieldAlert className="w-4 h-4" />
              <span>Invite-only access</span>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full"
              autoComplete="email"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending magic link...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send magic link
              </>
            )}
          </Button>

          {message && (
            <div className={`text-sm text-center p-3 rounded-lg ${
              message.includes('Check your email') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          We'll send you a magic link to sign in instantly
        </div>
      </div>
    </div>
  );
}
