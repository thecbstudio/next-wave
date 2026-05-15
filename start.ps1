$env:ANTHROPIC_API_KEY = (Get-Content .env.local | Where-Object { $_ -match "^ANTHROPIC_API_KEY=" }) -replace "^ANTHROPIC_API_KEY=", ""
npm run dev
