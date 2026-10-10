-- Índice ANN para la búsqueda semántica. vector_ip_ops porque el retriever ordena con <#> (producto punto)
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx"
  ON "document_chunks" USING hnsw ("embedding" vector_ip_ops);

-- Borrado de chunks por repo/archivo en la ingesta incremental
CREATE INDEX IF NOT EXISTS "document_chunks_repo_source_idx"
  ON "document_chunks" ((metadata->>'repoUrl'), (metadata->>'source'));
