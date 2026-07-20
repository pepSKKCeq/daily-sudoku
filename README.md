# Daily Sudoku

A premium daily Sudoku MVP built with Next.js, TypeScript and Tailwind CSS.

## Run locally

1. Install Node.js 20.9 or newer.
2. In this folder run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

## Deploy to GitHub and Vercel

1. Create an empty GitHub repository.
2. In the project folder run `git init`, `git add .`, `git commit -m "Initial Daily Sudoku"`.
3. Connect the repository: `git remote add origin <your-repository-url>` then `git branch -M main` and `git push -u origin main`.
4. Sign in at vercel.com, choose **Add New → Project**, import the GitHub repository, and click **Deploy**. Vercel detects Next.js automatically.
5. Each push to `main` will now deploy automatically. Add a custom domain in the Vercel project settings when ready.

The puzzle is deterministically derived from the UTC date in `lib/sudoku.ts`, so every visitor gets the same new puzzle after midnight UTC without a database or scheduled job.
