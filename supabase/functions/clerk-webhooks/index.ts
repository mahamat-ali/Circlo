
import { createClient } from 'npm:@supabase/supabase-js'
import { Webhook } from 'npm:svix'
import { WebhookEvent } from 'npm:@clerk/backend'

// IMPORTANT: These secrets must be set in your Supabase project's Edge Function settings
const CLERK_WEBHOOK_SECRET = Deno.env.get('CLERK_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  // 1. Verify environment variables
  if (!CLERK_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables')
    return new Response('Internal Server Error: Missing environment variables', { status: 500 })
  }

  // 2. Verify the webhook signature
  const headers = Object.fromEntries(req.headers.entries())
  const payload = await req.json()
  const svix_id = headers['svix-id']
  const svix_timestamp = headers['svix-timestamp']
  const svix_signature = headers['svix-signature']

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', { status: 400 })
  }

  const wh = new Webhook(CLERK_WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(JSON.stringify(payload), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Could not verify webhook', { status: 400 })
  }

  // 3. Handle the webhook event
  const eventType = evt.type;
  if (eventType === 'user.created') {
    const { id, email_addresses, username, image_url } = evt.data;
    console.log(`Processing 'user.created' event for user ID: ${id}`);

    // 4. Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } } // Important for server-side operations
    )

    // 5. Prepare the data for insertion
    // The database will handle defaults for created_at, updated_at, onboarding_completed, and subscription_type
    const newUser = {
      id: id,
      email: email_addresses[0]?.email_address,
      username: username,
      avatar_url: image_url,
    };

    // 6. Insert the new user into the public.users table
    const { data, error } = await supabaseClient
      .from('users')
      .insert(newUser);

    if (error) {
      console.error('Error inserting user:', error);
      // Check for specific errors, like unique constraint violations
      if (error.code === '23505') { // unique_violation
        return new Response('Error: User already exists.', { status: 409 });
      }
      return new Response(`Error inserting user: ${error.message}`, { status: 500 });
    }

    console.log('Successfully inserted new user:', data);
  } else {
    console.log(`Received unhandled event type: ${eventType}`);
  }

  return new Response('Webhook processed successfully', { status: 200 });
})
