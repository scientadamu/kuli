Shukrullah Sales App

This is a simple demo project with a React frontend and an Express backend.
It supports three user roles: admin, salesperson, and guest. Sales can be created
and appended to Google Sheets (if configured) or saved locally for demo.

Structure

- `server/` - Node.js + Express backend (Google Sheets integration helper)
- `client/` - Vite + React frontend

Quick setup (Windows PowerShell):

1. Install dependencies for server and client:

```powershell
cd c:\Users\hp\Desktop\shukrullah\server; npm install
cd ..\client; npm install
```

2. Configure Google Sheets (optional):

- Create a Google Cloud service account with "Sheets API" enabled.
- Download the service account JSON and set `GOOGLE_SERVICE_ACCOUNT_JSON` env variable
  to the path of that JSON file, or copy the JSON into `server/credentials.json`.
- Set `GOOGLE_SHEET_ID` to your spreadsheet ID.

3. Run the server and client (two terminals):

```powershell
# Terminal 1
cd c:\Users\hp\Desktop\shukrullah\server
npm start

# Terminal 2
cd c:\Users\hp\Desktop\shukrullah\client
npm run dev
```

Notes

- If Google Sheets isn't configured the server will save sales to `server/sales.json`.
- Admin can upload CSV with previous records via `/api/upload`.

Company Info
Shukrullah
Block 390, Talba Housing Estate, Off Minna Bida Road, Minna, Niger State

If you'd like, I can:

- Wire your Google Sheets credentials into the repo (not recommended for security)
- Add authentication persistence and password hashing
- Improve UI styling or add Tailwind/Material UI
