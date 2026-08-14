import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://school-management-demo.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaG9vbC1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.demoKeyForSchoolManagementSystem1234567890';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

  const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'School Management Fullstack Auth Server' });
  });

  // Seed default Admin account (username: anas, password: 123)
  app.post('/api/auth/seed-admin', async (req, res) => {
    try {
      const adminEmail = 'anas@school.edu';
      const adminUsername = 'anas';
      const adminPassword = '123';

      let uid = `usr-admin-anas`;
      const { data: signUpData } = await supabaseServerClient.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            displayName: 'Anas (Principal Admin)',
            username: adminUsername,
            role: 'Admin'
          }
        }
      });

      if (signUpData?.user) {
        uid = signUpData.user.id;
      }

      const { data: userRow, error: userError } = await supabaseServerClient
        .from('users')
        .upsert([
          {
            uid,
            email: adminEmail,
            username: adminUsername,
            display_name: 'Anas (Principal Admin)',
            role: 'Admin',
            status: 'Active'
          }
        ], { onConflict: 'email' })
        .select()
        .single();

      res.json({ success: true, message: 'Admin anas seeded successfully', uid });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to seed admin' });
    }
  });

  // Admin Endpoint: Create User Account (Teacher/Accountant/Admin)
  app.post('/api/auth/create-user', async (req, res) => {
    try {
      const { displayName, email, username, password, role, teacherId } = req.body;
      if (!displayName || !email || !username || !role) {
        return res.status(400).json({ success: false, error: 'Missing required user fields' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim().toLowerCase();
      const userPassword = password || 'SchoolPass123!';

      let createdUid = `usr-${Date.now()}`;

      const { data: authData } = await supabaseServerClient.auth.signUp({
        email: cleanEmail,
        password: userPassword,
        options: {
          data: {
            displayName,
            username: cleanUsername,
            role
          }
        }
      });

      if (authData?.user) {
        createdUid = authData.user.id;
      }

      const payload = {
        uid: createdUid,
        email: cleanEmail,
        username: cleanUsername,
        display_name: displayName,
        role: role,
        status: 'Active',
        teacher_id: teacherId || null
      };

      const { data: userRow, error: userErr } = await supabaseServerClient
        .from('users')
        .upsert([payload], { onConflict: 'email' })
        .select()
        .single();

      if (userErr) throw userErr;

      if (teacherId) {
        await supabaseServerClient
          .from('teachers')
          .update({ username: cleanUsername, status: 'Active' })
          .eq('teacher_id', teacherId);
      }

      res.json({ success: true, user: userRow });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to create user' });
    }
  });

  // Admin Endpoint: Reset Password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabaseServerClient.auth.resetPasswordForEmail(cleanEmail);

      res.json({
        success: true,
        message: `Password reset instructions sent to ${cleanEmail}`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to reset password' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fullstack Auth Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
