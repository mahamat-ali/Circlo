# User Authentication and Onboarding Flow Documentation

This document outlines the complete process for user authentication and onboarding in this application. The system uses Clerk for authentication and Supabase for the database. New users are automatically added to the database via a webhook and are then required to complete an onboarding form before accessing the main application.

## Part 1: Database Setup (Supabase)

This section covers the creation and configuration of the `public.users` table, which stores all user-related data.

### Step 1.1: Create the `users` Table

The following SQL script creates the `users` table with all necessary columns, constraints, and security policies. The `id` column is of type `TEXT` to store Clerk's string-based user IDs.

Run this script in the **Supabase SQL Editor**.

```sql
-- 1. Create a custom ENUM type for subscription levels.
CREATE TYPE subscription_level AS ENUM ('standard', 'pro', 'vip');

-- 2. Create the public.users table.
CREATE TABLE public.users (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  phone_number TEXT UNIQUE,
  address TEXT,
  bio TEXT,
  avatar_url TEXT,
  subscription_type subscription_level DEFAULT 'standard' NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.users IS 'Stores public user profile information.';
COMMENT ON COLUMN public.users.id IS 'User ID from Clerk.';
COMMENT ON COLUMN public.users.avatar_url IS 'URL for the user\'s profile picture.';
COMMENT ON COLUMN public.users.subscription_type IS 'User\'s subscription level.';

-- 3. Create a trigger to automatically update the updated_at timestamp.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Enable Row Level Security (RLS) and create policies for Clerk.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual user access to their own profile"
ON public.users
FOR SELECT
USING ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Allow individual user to update their own profile"
ON public.users
FOR UPDATE
USING ((auth.jwt() ->> 'sub') = id)
WITH CHECK ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Allow individual user to insert their own profile"
ON public.users
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'sub') = id);

-- 5. Grant permissions to the 'authenticated' role.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE, INSERT ON TABLE public.users TO authenticated;
```

## Part 2: Server-Side Logic (Clerk Webhook & Supabase Edge Function)

This part handles the automatic creation of a user in our database when a new user signs up in Clerk.

### Step 2.1: Create the Edge Function

The code for the Supabase Edge Function is located at `supabase/functions/clerk-webhooks/index.ts`. This function listens for incoming requests from the Clerk webhook.

**Key Logic:**
- It verifies that the request is genuinely from Clerk using a signing secret.
- It handles the `user.created` event.
- It uses the Supabase `service_role` key to securely bypass RLS and insert the new user's data (`id`, `email`, `username`, `avatar_url`) into the `public.users` table.

### Step 2.2: Configure the Clerk Webhook

This is a manual setup step in your Clerk dashboard.

1.  Navigate to your **Clerk Dashboard**.
2.  Go to **Webhooks** and click **Add Endpoint**.
3.  **Endpoint URL**: Paste the URL of your deployed Supabase Edge Function. You can find this in your Supabase Dashboard under **Edge Functions** > `clerk-webhooks`.
4.  **Events**: Select the `user.created` event.
5.  **Create** the endpoint.
6.  **Signing Secret**: After creating, view the endpoint's details and copy the **Signing Secret**. You will need this for the next step.

### Step 2.3: Set Edge Function Secrets

For the Edge Function to work, it needs access to several secret keys.

1.  Navigate to your **Supabase Dashboard**.
2.  Go to **Edge Functions** > `clerk-webhooks` > **Secrets**.
3.  Add the following three secrets:
    -   `CLERK_WEBHOOK_SECRET`: The signing secret you copied from the Clerk dashboard.
    -   `SUPABASE_URL`: Your project's URL from Supabase settings.
    -   `SUPABASE_SERVICE_ROLE_KEY`: Your project's `service_role` key from Supabase API settings.

### Step 2.4: Deploy the Edge Function

Deploy the function from your terminal using the Supabase CLI:

```bash
supabase functions deploy clerk-webhooks --no-verify-jwt
```
*The `--no-verify-jwt` flag is required because the webhook is authenticated via its signature, not a user's JWT.*

## Part 3: Client-Side Setup (React Native App)

This section covers the configuration required within the React Native application itself.

### Step 3.1: Set Environment Variables

1.  Ensure you have a `.env` file in the root of your project.
2.  Add your Clerk and Supabase **public** keys to this file. The app uses these to connect to the services.

    ```env
    # Clerk Public Key
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

    # Supabase Public Keys
    EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
    EXPO_PUBLIC_SUPABASE_KEY=your-public-anon-key
    ```
3.  **Important**: After editing the `.env` file, you must **restart your development server** for the changes to apply.

### Step 3.2: Configure Supabase to Trust Clerk JWTs

This is a critical step to make Row Level Security work correctly.

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** > **Providers**.
3.  Enable the **JWT** provider.
4.  In the **JWT Secret** field, paste your **JWKS Endpoint URL** from Clerk.
    -   You can find this in your **Clerk Dashboard** under **API Keys** > **Advanced**. It will look like `https://your-app.clerk.accounts.dev/.well-known/jwks.json`.
5.  Click **Save**.

## Part 4: The Onboarding Flow in Action

This is how the application forces new users to complete their profile.

### Step 4.1: The Onboarding Screen

-   The UI for the onboarding form is located at `src/app/(auth)/onboarding.tsx`.
-   When a user fills out and submits this form, the `handleOnboarding` function is triggered.
-   This function updates the user's record in the `public.users` table with the new information and, most importantly, sets `onboarding_completed` to `true`.

### Step 4.2: Enforcing the Onboarding Flow

-   The logic that protects the app is located in the root layout file: `src/app/_layout.tsx`.
-   The `InitialLayout` component runs on app startup.
-   It checks if a user is logged in. If they are, it queries the `users` table for the `onboarding_completed` status.
-   If the flag is `false`, the user is immediately redirected to the `/onboarding` screen. They cannot navigate to any other part of the app until the flag is set to `true`.
