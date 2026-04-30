# Prompt Authoring

Prompts live under `prompts/` and are packaged with the API artifact.

## Current prompt set

- `system.md`
- `grammar-review.md`
- `citation-review.md`
- `referencing-review.md`
- `policy-review.md`
- `synthesis.md`

## Editing guidance

Keep each specialist narrow. The safer the scope, the more predictable the output.

Recommended rules:

1. Do not combine multiple responsibilities into one prompt unless the workflow changes with it.
2. Prefer direct instructions over stylistic wording.
3. Tell the model what to do when evidence is missing.
4. Avoid asking for certainty when the model should be flagging uncertainty.
5. Keep output shape stable so downstream code is easier to reason about.

## Review process

For prompt changes, treat them like code changes:

1. Review diff carefully.
2. Exercise the local preview path.
3. Validate outputs in a preview environment before production promotion.
4. Record any risky changes in the pull request.
