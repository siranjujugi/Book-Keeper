# Deployment

## GitHub OAuth Values

For local development, create the GitHub OAuth app with:

```text
Homepage URL: http://localhost:8081
Authorization callback URL: https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

The callback URL is Supabase's callback endpoint, not the Expo app URL. Supabase receives the GitHub callback and then redirects back to the app.

In Supabase Authentication settings, allow these redirect URLs for local development:

```text
http://localhost:8081
http://localhost:8081/auth/callback
bookkeeper://auth/callback
```

For production, use your deployed URL as the GitHub OAuth app Homepage URL, for example:

```text
https://book-keeper.<your-region>.codeengine.appdomain.cloud
```

Keep the GitHub OAuth Authorization callback URL as:

```text
https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

Then add the production app callback to Supabase:

```text
https://book-keeper.<your-region>.codeengine.appdomain.cloud/auth/callback
```

## IBM Cloud Recommendation

For limited resources, the best web deployment path is a static Expo web build.

Preferred low-resource option:

- Build with `npm run app:web:build`
- Upload `expo-app/dist` to IBM Cloud Object Storage
- Put a custom domain/CDN in front if needed

This is the cheapest runtime model because there is no always-running server.

Simpler container option:

- Use IBM Cloud Code Engine
- Build the included `expo-app/Dockerfile`
- Let Code Engine scale the container down when idle

Code Engine is easier operationally than Kubernetes for this app. Kubernetes is not worth the overhead for a personal static app.

## Build Locally

```bash
npm run app:web:build
```

The static web output is generated in:

```text
expo-app/dist
```

## IBM Code Engine Container

From the repository root:

```bash
ibmcloud login
ibmcloud target -g <resource-group>
ibmcloud ce project create --name book-keeper
ibmcloud ce project select --name book-keeper
ibmcloud ce app create --name book-keeper --build-source ./expo-app --port 8080 --min-scale 0 --max-scale 1
```

After deployment, take the Code Engine app URL and add it to:

- GitHub OAuth app Homepage URL
- Supabase Auth redirect URLs
