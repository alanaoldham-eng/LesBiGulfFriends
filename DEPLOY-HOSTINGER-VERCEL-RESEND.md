# Deploy Guide — Vercel + Hostinger Domain + Supabase + Resend

## Recommended architecture
- App hosting: Vercel
- Domain registrar/DNS: Hostinger
- Database/Auth: Supabase
- Auth email delivery: Resend SMTP

## Important clarification
If you deploy the app on Vercel, Vercel is the web host.
Hostinger can still be used for:
- the domain registration
- DNS management
- mailboxes
- backup file storage

If you want Hostinger to host the running Next.js app instead, you would move the app off Vercel onto Hostinger's Node.js hosting.

## 1) Connect your domain from Hostinger to Vercel
In Vercel, add:
- lesbigulffriends.com
- www.lesbigulffriends.com

Vercel will show the required DNS records. Add those exact records in Hostinger DNS. Commonly:
- root/apex `@` → A record to the Vercel IP shown by Vercel
- `www` → CNAME to `cname.vercel-dns.com`

Use Vercel's domain screen as the source of truth.

## 2) Vercel environment variables
Set:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL=https://lesbigulffriends.com

Redeploy after changing env vars.

## 3) Supabase Auth URL configuration
Set:
- Site URL = https://lesbigulffriends.com
- Redirect URLs:
  - https://lesbigulffriends.com/auth/callback
  - https://www.lesbigulffriends.com/auth/callback
  - http://localhost:3000/auth/callback

## 4) Resend SMTP in Supabase
In Resend:
- add and verify lesbigulffriends.com
- create an API key

In Supabase Authentication email/SMTP settings use:
- Host: smtp.resend.com
- Port: 587
- Username: resend
- Password: YOUR_RESEND_API_KEY
- Sender email: onboarding@lesbigulffriends.com
- Sender name: Les Bi Gulf Friends

## 5) Test flow
- sign up
- verify email once
- log in with password
- forgot password
- profile setup
- create/join group

## Account creation email failed

If signup says "failed to send email", the app code is usually fine and the issue is on the auth email side.

Check these in Supabase:
1. Authentication email confirmation is enabled the way you expect
2. Custom SMTP is configured
3. Resend domain is verified
4. Sender address matches the verified domain
5. Site URL and Redirect URLs are correct

Recommended sender:
- onboarding@lesbigulffriends.com

## v045 storage setup
The new package uploads files directly to Supabase Storage.

Buckets used:
- profile-photos
- chat-media

The included SQL migration creates both buckets and the basic policies:
- `supabase-v045-photo-main-group-attachments.sql`
