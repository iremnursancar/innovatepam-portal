# Product Requirements Document: InnovatEPAM Portal - Phase 1 MVP

## 1. Executive Summary

**Product Name**: InnovatEPAM Portal  
**Version**: Phase 1 MVP  
**Date**: February 2026  
**Owner**: İrem Nur Sancar

**Purpose**: Enable EPAM employees to submit innovation ideas and evaluators to review them systematically.

**Key Objectives**:
- Provide secure authentication for all users
- Enable idea submission with file attachments
- Support admin evaluation workflow
- Track idea status throughout lifecycle

---

## 2. Product Vision

Transform EPAM's innovation process from ad-hoc email submissions to a structured, transparent platform where:
- Employees feel empowered to share ideas
- Evaluators can efficiently review and provide feedback
- Leadership gains visibility into innovation pipeline
- Ideas are tracked from submission to decision

---

## 3. Target Users

**Primary Users**:
- **Submitters** (Employees): Submit innovation proposals
- **Admins/Evaluators**: Review and decide on submissions

**User Personas**:
- **Sarah (Submitter)**: Software engineer with process improvement ideas
- **Mark (Admin)**: Innovation manager evaluating 20-30 ideas/month

---

## 4. Key Features (Phase 1)

### 4.1 User Authentication
- Secure registration with email/password
- Role-based access (submitter vs admin)
- Session management

### 4.2 Idea Submission
- Structured form: title, description, category
- Single file attachment support
- Immediate "Submitted" status assignment

### 4.3 Idea Management
- Role-based idea listing (users see own, admins see all)
- Idea detail view with full information
- Status visibility throughout workflow

### 4.4 Evaluation Workflow
- Admin status updates ("Under Review")
- Accept/Reject decisions with mandatory comments
- Evaluation history preservation

---

## 5. Success Metrics

- **User Adoption**: 50+ registered users in first month
- **Submission Rate**: 20+ ideas submitted in first month
- **Evaluation Speed**: Average 3 days from submission to decision
- **User Satisfaction**: 80%+ satisfaction in post-launch survey

---

## 6. Technical Requirements

**Stack**: Node.js, Express, SQLite, React, Tailwind  
**Security**: JWT authentication, bcrypt password hashing  
**Performance**: Page load < 2 seconds  
**Availability**: 99% uptime

---

## 7. Out of Scope (Phase 1)

- Email notifications
- Idea comments/discussion
- Rich-text editor
- Advanced search/filtering
- Mobile app
- Multiple file attachments

---

## 8. Timeline

**Development**: 2 weeks (February 2026)  
**Testing**: Continuous (TDD approach)  
**Launch**: End of February 2026

---

## 9. Dependencies

- EPAM employee email directory (for validation)
- File storage infrastructure
- Production hosting environment

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption | High | Clear communication, training sessions |
| Data loss | Critical | Regular backups, database migrations tested |
| Security breach | Critical | Security audit before launch |
