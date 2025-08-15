# Supabase Setup Guide for Zimako DCMS

This guide will help you set up your Supabase backend for the Zimako Debt Collection Management System.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project
3. Choose a name for your project (e.g., "zimako-dcms")
4. Set a secure database password
5. Choose a region closest to your users
6. Wait for your project to be created

## 2. Get Your API Keys

1. Once your project is created, go to the project dashboard
2. In the left sidebar, click on "Settings" (gear icon) > "API"
3. You'll find your API URL and API Keys here
4. Copy the following values:
   - **URL**: `https://[your-project-id].supabase.co`
   - **anon/public key**: This is your public API key
   - **service_role key**: This is your admin API key (keep this secure!)

## 3. Set Up Environment Variables

1. Create a `.env.local` file in the root of your project
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. Set Up Database Schema

1. In the Supabase dashboard, go to "SQL Editor"
2. Create a new query
3. Copy and paste the SQL from `scripts/setup-supabase.sql`
4. Run the query to create all necessary tables and policies

## 5. Create Initial User

To create your first debt collection agent user with the following credentials:
- Email: tjmarvin83@gmail.com
- Password: 832287767@Tj

You have two options:

### Option A: Using the Supabase Dashboard

1. Go to "Authentication" > "Users" in the Supabase dashboard
2. Click "Invite user"
3. Enter the email address: tjmarvin83@gmail.com
4. After the user is created, go to the SQL Editor and run:

```sql
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now() 
WHERE email = 'tjmarvin83@gmail.com';

INSERT INTO profiles (id, full_name, email, role)
SELECT id, 'TJ Marvin', 'tjmarvin83@gmail.com', 'agent'
FROM auth.users
WHERE email = 'tjmarvin83@gmail.com';
```

5. The user can now set their password by using the "Forgot Password" feature on the login page

### Option B: Using the Admin API Script

1. Install the required dependencies:
   ```
   npm install dotenv @supabase/supabase-js
   ```

2. Make sure your `.env.local` file includes the `SUPABASE_SERVICE_ROLE_KEY`

3. Run the script:
   ```
   node scripts/create-initial-user.js
   ```

## 6. Test Your Authentication

1. Start your Next.js application:
   ```
   npm run dev
   ```

2. Go to the login page
3. Enter the credentials:
   - Email: tjmarvin83@gmail.com
   - Password: 832287767@Tj
4. You should be successfully logged in and redirected to the user dashboard

## 7. Additional Configuration

### Email Templates

You can customize email templates for password reset, magic links, etc. in the Supabase dashboard:

1. Go to "Authentication" > "Email Templates"
2. Customize the templates to match your branding

### Storage

If you need to store files (like profile pictures or documents):

1. Go to "Storage" in the Supabase dashboard
2. Create a new bucket (e.g., "avatars", "documents")
3. Set the appropriate permissions

### Edge Functions

For any serverless functions you might need:

1. Go to "Edge Functions" in the Supabase dashboard
2. Create new functions as needed

## Troubleshooting

- **Authentication Issues**: Check the Authentication logs in the Supabase dashboard
- **Database Errors**: Check the SQL Editor for any error messages
- **API Connection Issues**: Verify your environment variables are set correctly
