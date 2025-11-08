# Team Collaboration Guidelines

## Communication

- **Slack/Discord:** Real-time questions and updates
- **GitHub Issues:** Track bugs and features
- **Git Commits:** Descriptive messages

## Git Workflow

### Commit Message Format

```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

Examples:
- feat: implement semantic cache with LangCache
- fix: handle Gemini API timeout gracefully
- docs: add API endpoint documentation
```

### Before You Commit

1. Test your changes locally
2. Make sure server/app still runs
3. Write clear commit message
4. Push to your development branch

### Merging to Main

Only merge to `main` when:

- Feature is complete
- Tests pass
- Code runs without errors
- Teammate is aware (if affects their work)

## Working Independently

### Backend Engineer Works On:

- `backend/` directory
- API endpoints
- Core logic
- Testing scripts

### Frontend Engineer Works On:

- `frontend/` directory
- Components
- Dashboard UI
- API integration

**Conflicts are rare** because we work in different directories.

## Integration Points

### When Backend Changes API:

1. Update `backend/README.md` with new format
2. Notify frontend engineer
3. Update main README if needed

### When Frontend Needs New Endpoint:

1. Create GitHub issue describing need
2. Backend engineer implements
3. Test together before continuing

## Daily Sync (5 minutes)

**Schedule:** Every 8-12 hours

**Discuss:**

- What did you complete?
- What are you working on next?
- Any blockers?
- Do we need to integrate/test anything together?

## Pre-Demo Integration (4 hours before)

1. Both push all changes to main
2. Fresh clone of repo on demo laptop
3. Run full setup together
4. Test end-to-end flow
5. Practice demo handoff

## Demo Day Roles

### Backend Engineer:

- Start backend server
- Monitor logs during demo
- Handle technical questions about orchestration
- Explain architecture decisions

### Frontend Engineer:

- Drive the dashboard during demo
- Narrate what's happening visually
- Show different views/features
- Handle UI/UX questions

---

**Remember:** We're a team. Help each other. Communicate early and often.
