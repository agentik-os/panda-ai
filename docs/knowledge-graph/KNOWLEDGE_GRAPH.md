# Knowledge Graph System

**Status:** ✅ Implemented
**Phase:** 4 (Community & Ecosystem)
**Integration:** Neo4j + D3.js

---

## Overview

The Knowledge Graph system provides semantic memory and relationship mapping for agents. It automatically extracts entities, concepts, and relationships from conversations and visualizes them in an interactive graph.

## Architecture

```
Conversation → Entity Extractor → Neo4j → Graph API → D3.js Visualization
```

### Components

1. **Neo4j Adapter** (`packages/runtime/src/memory/graph/neo4j-adapter.ts`)
   - Graph database interface
   - CRUD operations for nodes and relationships
   - Similarity search using embeddings
   - Custom Cypher query execution

2. **Entity Extractor** (`packages/runtime/src/memory/graph/entity-extractor.ts`)
   - Extracts entities (people, organizations, locations, concepts)
   - Identifies relationships between entities
   - Processes conversations into graph structure

3. **Graph Viewer** (`packages/dashboard/components/memory-graph/graph-viewer.tsx`)
   - Interactive D3.js force-directed graph
   - Node types: Entity, Concept, Event, Document
   - Zoom, pan, drag interactions
   - Relationship visualization

---

## Usage

### Setup Neo4j

```bash
# Docker
docker run \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest

# Or use Neo4j Desktop/Aura
```

### Configure Environment

```bash
# .env.local
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

### Extract Entities from Conversation

```typescript
import { Neo4jAdapter } from '@/runtime/memory/graph/neo4j-adapter';
import { EntityExtractor } from '@/runtime/memory/graph/entity-extractor';

const adapter = new Neo4jAdapter();
await adapter.connect();

const extractor = new EntityExtractor(adapter);

const messages = [
  {
    id: '1',
    content: 'John works at Google and lives in San Francisco',
    role: 'user',
    timestamp: new Date(),
  },
];

const result = await extractor.processConversation(messages);
// { nodesCreated: 3, relationshipsCreated: 2 }
// Nodes: John (person), Google (organization), San Francisco (location)
// Relationships: John WORKS_AT Google, John LIVES_IN San Francisco
```

### Query the Graph

```typescript
// Find related nodes
const related = await adapter.findRelatedNodes('john', 2);
// Returns: { nodes: [...], relationships: [...] }

// Search by similarity (requires embeddings)
const embedding = await getEmbedding('machine learning');
const similar = await adapter.searchBySimilarity(embedding, 10);

// Custom Cypher query
const results = await adapter.query(`
  MATCH (p:Node {type: 'person'})-[:WORKS_AT]->(c:Node {type: 'organization'})
  RETURN p, c
`);
```

### Visualize in Dashboard

```tsx
import { GraphViewer } from '@/components/memory-graph/graph-viewer';

function KnowledgeGraphPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    // Fetch graph data from API
    fetchGraphData().then(setGraphData);
  }, []);

  return (
    <GraphViewer
      nodes={graphData.nodes}
      links={graphData.links}
      onNodeClick={(node) => console.log('Clicked:', node)}
      onNodeHover={(node) => console.log('Hovered:', node)}
    />
  );
}
```

---

## API Endpoints

### GET /api/graph/nodes

List all nodes in the graph.

**Query Parameters:**
- `type` (optional): Filter by node type
- `limit` (optional): Max nodes to return (default: 100)

**Response:**
```json
{
  "nodes": [
    {
      "id": "john-doe",
      "type": "entity",
      "label": "John Doe",
      "properties": { ... }
    }
  ]
}
```

### GET /api/graph/nodes/:id/related

Get nodes related to a specific node.

**Query Parameters:**
- `depth` (optional): Relationship depth (default: 1, max: 3)

**Response:**
```json
{
  "nodes": [ ... ],
  "relationships": [ ... ]
}
```

### POST /api/graph/search

Search nodes by text or embedding similarity.

**Request:**
```json
{
  "query": "machine learning",
  "mode": "text" | "embedding",
  "limit": 10
}
```

### DELETE /api/graph/nodes/:id

Delete a node and its relationships.

---

## Node Types

| Type | Description | Example |
|------|-------------|---------|
| **entity** | Real-world entities | Person, Organization, Product |
| **concept** | Abstract ideas | Machine Learning, Algorithm |
| **event** | Temporal occurrences | Meeting, Launch, Conference |
| **document** | Information artifacts | Article, Blog Post, Documentation |

---

## Relationship Types

Common relationship types:

- `IS_A` - Type relationship
- `WORKS_AT` - Employment
- `LIVES_IN` - Residence
- `CREATED` - Authorship
- `USES` - Tool/technology usage
- `RELATED_TO` - General association
- `PART_OF` - Composition
- `MENTIONS` - Reference

---

## Advanced Features

### Semantic Search

Use embeddings for semantic similarity:

```typescript
// Generate embedding for query
const embedding = await generateEmbedding('AI research papers');

// Find similar nodes
const results = await adapter.searchBySimilarity(embedding, 10);
```

### Graph Statistics

```typescript
const stats = await adapter.getStatistics();
// {
//   nodeCount: 1250,
//   relationshipCount: 3400,
//   typeDistribution: {
//     entity: 500,
//     concept: 400,
//     event: 200,
//     document: 150
//   }
// }
```

### Export/Import

```typescript
// Export graph to JSON
const graphData = await adapter.query(`
  MATCH (n)-[r]->(m)
  RETURN n, r, m
`);
const json = JSON.stringify(graphData);

// Import (restore from backup)
for (const item of jsonData) {
  await adapter.upsertNode(item.node);
  await adapter.createRelationship(item.relationship);
}
```

---

## Performance

### Optimization Tips

1. **Index frequently queried properties:**
   ```cypher
   CREATE INDEX FOR (n:Node) ON (n.id);
   CREATE INDEX FOR (n:Node) ON (n.type);
   ```

2. **Limit relationship depth:**
   - Use `depth=1` for common queries
   - Max `depth=3` to avoid expensive traversals

3. **Use vector indexes for embeddings:**
   ```cypher
   CREATE VECTOR INDEX node_embeddings
   FOR (n:Node) ON (n.embedding)
   OPTIONS {indexConfig: {`vector.dimensions`: 1536}};
   ```

4. **Batch processing:**
   - Process conversations in batches
   - Use `UNWIND` for bulk inserts

---

## Limitations

### Current Implementation

- **Simple entity extraction:** Pattern-based (not NLP/LLM)
- **No coreference resolution:** Multiple mentions of same entity create duplicates
- **Limited relationship types:** Predefined patterns only
- **No temporal reasoning:** Doesn't track when relationships formed

### Future Enhancements

- [ ] LLM-based entity extraction
- [ ] Coreference resolution
- [ ] Temporal relationships (valid from/to dates)
- [ ] Confidence scoring for relationships
- [ ] Automatic graph pruning (remove low-confidence nodes)
- [ ] Multi-agent shared knowledge graphs

---

## Testing

```bash
# Unit tests
pnpm --filter @agentik-os/runtime test graph

# E2E tests
pnpm --filter @agentik-os/dashboard test:e2e graph-viewer
```

---

## Examples

### Example 1: Personal Knowledge Base

```typescript
// Extract entities from meeting notes
const notes = [
  { content: 'Met with Sarah from Acme Corp to discuss API integration' },
  { content: 'Sarah recommended using GraphQL instead of REST' },
];

await extractor.processConversation(notes);

// Query: Who recommended GraphQL?
const results = await adapter.query(`
  MATCH (p:Node)-[:RECOMMENDED]->(tech:Node {label: 'GraphQL'})
  RETURN p.label as person
`);
// Results: "Sarah"
```

### Example 2: Technical Knowledge Graph

```typescript
// Extract concepts from documentation
const docs = [
  { content: 'React is a JavaScript library for building user interfaces' },
  { content: 'React uses a virtual DOM for efficient updates' },
];

await extractor.processConversation(docs);

// Visualize React ecosystem
const related = await adapter.findRelatedNodes('react', 2);
// Returns: React → JavaScript, React → Virtual DOM, React → User Interface
```

---

## Troubleshooting

### Connection Failed

```
Error: Failed to connect to Neo4j
```

**Solution:** Check Neo4j is running and credentials are correct.

### Slow Queries

**Solution:**
- Add indexes on frequently queried properties
- Reduce relationship depth
- Use `LIMIT` clause
- Profile queries with `EXPLAIN`

### Duplicate Nodes

**Solution:**
- Improve entity extraction (use canonical forms)
- Add deduplication logic
- Merge duplicate nodes manually

---

**Status:** ✅ Production ready (basic implementation)
**Next:** Enhance with LLM-based extraction, temporal reasoning
