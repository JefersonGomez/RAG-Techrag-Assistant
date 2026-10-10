# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: React + Vite (TypeScript) in `web/`, built to static files and served by the same Express API, so it ships as one deploy on one domain (`rag.jefersonbustamante.duckdns.org`). Chosen because it matches the owner's portfolio stack and the app now has login, per-user history and an admin panel. The user asked for "where the design looks best, with login".

## Users

- **Visitors from the owner's portfolio** (recruiters, developers): sign in with GitHub and ask questions about the owner's indexed repositories to evaluate the project and the code.
- **The owner (admin, GitHub user `JefersonGomez`)**: uses it as a tool to understand their own repos, and indexes new repositories.

## Product Purpose

TechRAG Assistant answers technical questions about indexed GitHub repositories. It retrieves the relevant code and doc fragments (semantic search + re-ranking) and an LLM streams an answer that cites its sources by file and line range. Success: a visitor asks something about a repo and gets a grounded, cited answer within seconds; the owner can index a repo and query it right after.

## Positioning

Answers are grounded only in the indexed code and cite exact files and lines; when the context does not contain the answer it says "No tengo información suficiente." instead of inventing. Embeddings and re-ranking run locally on the owner's VPS (no paid inference API).

## Operating Context

- Visitors usually arrive from the portfolio (`jefersonbustamante.duckdns.org`), on desktop or phone.
- Sign-in with GitHub is required to chat. Each user's conversations are saved.
- Admin indexes repos by GitHub URL + branch; indexing can take minutes (CPU on the VPS).
- Rate limit: 10 questions per minute per IP.

## Capabilities and Constraints

- Streaming answers (SSE) with sources: file path, line range, relevance score.
- Filter questions by repository.
- Thumbs up/down feedback per answer.
- Admin-only: index a GitHub repo (full or incremental), see indexed repos.
- Only public `https://github.com/<owner>/<repo>` URLs can be indexed.
- UI language: Spanish.

## Evidence on Hand

- Indexed repo: `https://github.com/JefersonGomez/RAG-Techrag-Assistant` (this project).
- No testimonials, usage metrics or benchmarks exist; do not fabricate them.

## Product Principles

1. Grounded over fluent: show where every answer comes from.
2. The answer is the product: the conversation is the main stage, the chrome stays quiet.
3. Honest about limits: show when it doesn't know, when indexing is running, when something failed.
4. Fast to first value: from sign-in to the first answer in one step.
