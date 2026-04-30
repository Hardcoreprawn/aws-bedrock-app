import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';

interface UploadRequest {
  files: Array<{
    fileName: string;
    contentType: string;
  }>;
}

interface Finding {
  agent: string;
  summary: string;
  details: string;
}

interface ReviewRecord {
  reviewId: string;
  status: 'RUNNING' | 'COMPLETED';
  findings: Finding[];
  finalSummary?: string;
}

const app = express();
const port = Number(process.env.MOCK_API_PORT ?? '3000');
const reviewDelayMs = Number(process.env.MOCK_REVIEW_DELAY_MS ?? '1500');

const uploads = new Map<string, { fileName: string; contentType: string; body: string }>();
const reviews = new Map<string, ReviewRecord>();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/uploads', (request, response) => {
  const payload = request.body as UploadRequest;

  if (!payload.files?.length) {
    response.status(400).json({ message: 'At least one file is required.' });
    return;
  }

  response.json(
    payload.files.map((file) => {
      const objectKey = `${crypto.randomUUID()}-${file.fileName}`;
      uploads.set(objectKey, {
        fileName: file.fileName,
        contentType: file.contentType,
        body: ''
      });

      return {
        fileName: file.fileName,
        objectKey,
        uploadUrl: `http://localhost:${port}/mock-uploads/${objectKey}`
      };
    })
  );
});

app.put('/mock-uploads/:objectKey', express.raw({ type: '*/*', limit: '10mb' }), (request, response) => {
  const objectKey = request.params.objectKey;
  const existing = uploads.get(objectKey);

  if (!existing) {
    response.status(404).send('Unknown upload target');
    return;
  }

  uploads.set(objectKey, {
    ...existing,
    body: Buffer.isBuffer(request.body) ? request.body.toString('utf8') : ''
  });

  response.status(200).send('uploaded');
});

app.post('/reviews', (request, response) => {
  const documentKeys = request.body?.documentKeys as string[] | undefined;

  if (!documentKeys?.length) {
    response.status(400).json({ message: 'At least one uploaded document is required.' });
    return;
  }

  const reviewId = crypto.randomUUID();
  const initialRecord: ReviewRecord = {
    reviewId,
    status: 'RUNNING',
    findings: []
  };

  reviews.set(reviewId, initialRecord);
  queueMockReview(reviewId, documentKeys);

  response.status(202).json(initialRecord);
});

app.get('/reviews/:reviewId', (request, response) => {
  const review = reviews.get(request.params.reviewId);

  if (!review) {
    response.status(404).json({ message: 'Review not found.' });
    return;
  }

  response.json(review);
});

app.listen(port, () => {
  console.log(`Mock API listening on port ${port}`);
});

/**
 * Simulates asynchronous worker completion and writes a completed review record.
 */
function queueMockReview(reviewId: string, documentKeys: string[]) {
  setTimeout(() => {
    const documents = documentKeys
      .map((documentKey) => uploads.get(documentKey))
      .filter((document): document is NonNullable<typeof document> => Boolean(document));

    const combinedText = documents.map((document) => document.body || `[empty] ${document.fileName}`).join('\n\n');
    const findings = buildFindings(documents.length, combinedText);

    reviews.set(reviewId, {
      reviewId,
      status: 'COMPLETED',
      findings,
      finalSummary: `Mock review completed for ${documents.length} document(s). Priority focus: ${findings[0].summary}`
    });
  }, reviewDelayMs);
}

/**
 * Builds deterministic, human-readable findings for local preview mode.
 */
function buildFindings(documentCount: number, combinedText: string): Finding[] {
  const wordCount = combinedText.split(/\s+/).filter(Boolean).length;
  const hasReferences = /reference|bibliograph|citation/gi.test(combinedText);
  const hasPolicyTerms = /personal data|confidential|gdpr|regulated/gi.test(combinedText);

  return [
    {
      agent: 'Grammar and spelling',
      summary: wordCount > 250 ? 'Long passages should be tightened for readability.' : 'Draft reads cleanly at PoC level.',
      details: `Processed ${documentCount} document(s) with approximately ${wordCount} words. Review long sentences and repeated phrasing for clarity.`
    },
    {
      agent: 'Citation and bibliography',
      summary: hasReferences ? 'References detected; verify completeness manually.' : 'No clear citation section detected.',
      details: hasReferences
        ? 'A reference-related section was detected in the uploaded material. Check for missing metadata, broken URLs, and unsupported claims.'
        : 'The mock review did not detect obvious citation markers. Add source attribution where claims need evidence.'
    },
    {
      agent: 'Referencing consistency',
      summary: 'Cross-reference structure should be reviewed before formal release.',
      details: 'The mock reviewer flags section, table, and appendix references for manual validation because local preview mode does not parse document structure deeply.'
    },
    {
      agent: 'Policy and safety risk',
      summary: hasPolicyTerms ? 'Potential regulated-content markers detected.' : 'No obvious regulated-content terms detected in mock scan.',
      details: hasPolicyTerms
        ? 'Terms associated with confidential or regulated content were found. Treat this as a signal for human review, not an automated compliance decision.'
        : 'Mock safety scan found no strong regulated-content markers, but production review should still use Bedrock guardrails and human approval.'
    }
  ];
}
