# ADR-003: File Storage Strategy — Local Filesystem for Phase 1

**Date**: 2026-02-24
**Status**: Accepted
**Deciders**: Engineering team
**Relates to**: `specs/001-phase1-mvp/plan.md`, `docs/adrs/ADR-001-tech-stack.md`

---

## Context

InnovatEPAM Portal allows each idea submission to include a single file
attachment (PDF, DOCX, PNG, JPG, or XLSX) with a maximum size of 10 MB. Files
must be stored durably, served back to authenticated users on demand, and
validated for type and size before acceptance.

Constraints driving the decision:

- **Scale**: Phase 1 targets 10–50 concurrent internal users. Total attachment
  volume over the MVP lifecycle is estimated in the low hundreds of files and
  well under 1 GB in aggregate.
- **Deployment model**: Phase 1 runs as a single Node.js process on a single
  server. There is no multi-instance or distributed deployment in scope.
- **Budget**: No cloud service spend is approved for Phase 1. All infrastructure
  must be zero-marginal-cost open-source or hosted in-house.
- **Timeline**: 8 weeks to a working MVP. Any solution that requires cloud
  account setup, IAM configuration, or SDK integration adds timeline risk without
  commensurate Phase 1 benefit.
- **Constitution Principle V (Phased Simplicity)**: Complexity must be deferred
  until there is demonstrated, measurable need. Cloud object storage adds
  operational abstraction that serves no concrete Phase 1 requirement.

---

## Decision

Store uploaded files in a dedicated `backend/uploads/` directory on the local
filesystem of the application server.

**Handling library**: Multer (already a dependency for multipart form parsing).
**Naming**: Files are stored with a UUID-based filename to avoid collisions and
prevent path traversal via original filenames. The original filename is preserved
in the `attachments` database table for display purposes only.
**Serving**: Express serves files from `uploads/` as a static directory,
restricted to authenticated requests via the `authenticate` middleware.
**Git**: `backend/uploads/` is added to `.gitignore`; a `.gitkeep` is committed
to preserve the directory in the repository.

---

## Rationale

### Why local filesystem is correct for Phase 1

At 10–50 users, single-server deployment, and estimated attachment volume under
1 GB, the only practical benefit of cloud object storage would be operational
familiarity — not technical necessity. The local filesystem delivers everything
Phase 1 requires:

- **Durability**: Files survive application restarts and are as durable as the
  server's disk. For an internal MVP with a small user base, this is adequate.
- **Zero latency overhead**: File reads are direct I/O with no network hop to an
  external storage service.
- **Zero configuration**: No SDK, no credentials, no bucket policies, no IAM
  roles. Multer writes a file; Express reads it back. The implementation is
  fully contained within the application codebase.
- **Zero cost**: No storage or egress charges.

The primary risk of local storage — loss of files if the server disk fails — is
acceptable for Phase 1. A standard server backup policy (snapshot or rsync of
`uploads/`) provides sufficient protection at this scale.

### Why UUID filenames

Storing files under their original names would risk path traversal attacks
(e.g., a filename containing `../`) and name collisions if two users upload
files with the same name. UUID-based storage names decouple the stored file
from the user-supplied name entirely. The database record retains the original
filename for display; the filesystem record is opaque.

### Separation of concern: storage path from serving path

The absolute filesystem path is stored in the database but never exposed to
clients. Download responses stream the file content directly or use
`Content-Disposition: attachment; filename="<original_name>"` so clients see
the original filename regardless of the stored name. This encapsulation makes
future storage migration transparent to the frontend.

---

## Phase 2 Migration Path

When Phase 2 requirements justify cloud storage (multi-server deployment, CDN
delivery, or >1 GB aggregate storage), the migration is isolated to a single
boundary:

1. Replace the Multer `diskStorage` engine with a Multer-compatible S3 stream
   pipe (e.g., `multer-s3`) **or** keep Multer writing to a temp location and
   move files to S3 in the service layer after validation.
2. Update the `attachments` repository to store an S3 object key instead of a
   local path.
3. Replace the Express static file handler with a signed-URL generator or a
   proxy route that streams from S3.

No changes are required to the route layer, the frontend, or the database
schema (only the value stored in `attachments.stored_path` changes meaning).
This boundary is achievable because Constitution Principle IV (Layered
Architecture) keeps file-serving logic inside the service/repository layer and
out of the route handlers.

---

## Consequences

### Positive

- **No external dependencies**: The storage implementation requires no cloud
  account, SDK, credentials, or network egress. The full implementation is
  Multer configuration and an Express static handler — approximately 30 lines
  of code.
- **Fastest possible read latency**: Local disk I/O is faster than any network
  call to a remote object store, relevant for inline file preview.
- **Simple local development**: Every developer clones the repo and runs; no
  cloud emulator (LocalStack, Azurite) or shared bucket credentials required.
- **Clean migration seam**: Storage logic is isolated to the repository and
  middleware layers; Phase 2 migration requires no frontend or route changes.

### Negative / Trade-offs

- **Not horizontally scalable**: If Phase 2 deploys multiple application
  instances (load-balanced), files written to one instance's disk are not
  visible to others. Horizontal scaling requires migrating to shared storage
  first. This is the primary forcing function for the Phase 2 migration.
- **Backup is a manual concern**: Unlike cloud object storage (which provides
  built-in redundancy and versioning), local filesystem durability depends
  entirely on the server's backup policy. If the server disk fails without a
  recent backup, uploaded files are lost. Mitigation: document backup
  requirements in the operations runbook before Phase 1 goes live.
- **No CDN or geo-distribution**: Files are served from the application server.
  For a small internal user base on a local network this is irrelevant; for
  a geographically distributed workforce it would be a concern.
- **Disk usage is unbounded in code**: Phase 1 enforces a per-file 10 MB limit
  via Multer, but there is no total-disk-quota enforcement. At 50 ideas × 10 MB
  this is at most 500 MB, well within typical server provisioning, but a Phase 2
  quota or lifecycle policy is advisable.

---

## Alternatives Considered

### 1. AWS S3

**What it offers**: Industry-standard object storage with 99.999999999%
durability, built-in redundancy, versioning, lifecycle policies, pre-signed
URL generation, and CDN integration via CloudFront.

**Why rejected for Phase 1**: Requires an AWS account, IAM user or role
configuration, bucket policy setup, and the `@aws-sdk/client-s3` dependency.
Credentials must be securely injected into the deployment environment. None of
these requirements are intrinsically difficult, but all of them add setup and
maintenance overhead that delivers no benefit at 10–50 users on a single server.
Additionally, S3 storage and egress incur per-GB costs that are not budgeted for
Phase 1. **Recommended upgrade path for Phase 2.**

### 2. Azure Blob Storage

**What it offers**: Equivalent capabilities to AWS S3 within the Microsoft
Azure ecosystem — durable object storage, access tiers, SAS tokens, CDN
integration via Azure CDN.

**Why rejected for Phase 1**: Same constraints as AWS S3. Azure Blob Storage
additionally assumes an Azure subscription and familiarity with Azure IAM
(Managed Identities or connection strings), neither of which is established for
this project. If the organisation already uses Azure infrastructure, this
becomes the preferred Phase 2 migration target over S3.

### 3. Google Cloud Storage

**What it offers**: GCS provides similar object storage capabilities to S3 and
Azure Blob, with strong consistency and a generous free tier.

**Why rejected for Phase 1**: Same reasoning as S3 and Azure Blob. No GCP
infrastructure is in place for this project. The free tier could theoretically
absorb Phase 1 volume, but the account setup and credential management overhead
remains.

### 4. Database BLOB storage (SQLite)

**What it offers**: Files stored in the database as binary large objects keep
all application data in a single artifact — no separate file system management,
no orphaned files on delete.

**Why rejected**: SQLite is not designed for large binary storage. BLOBs
exceeding a few kilobytes bypass SQLite's page cache, causing significant memory
pressure and I/O amplification. Storing tens of 10 MB files in a SQLite database
would severely degrade query performance for all other tables. Database backups
would become proportionally larger and slower. This approach trades operational
simplicity for a hard performance regression with no compensating benefit.

---

## Review Triggers

This decision should be revisited if any of the following occur:

- Phase 2 requires deploying more than one application server instance (local
  filesystem is incompatible with horizontal scaling).
- Total attachment storage on the current server approaches 80% disk capacity.
- A file is lost due to disk failure, triggering an SLA or compliance concern
  that mandates higher-durability storage.
- The organisation establishes a cloud infrastructure baseline (AWS, Azure, or
  GCP account with IAM policies) making cloud storage the lower-friction option.
