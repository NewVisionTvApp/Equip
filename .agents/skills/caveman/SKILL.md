---
name: caveman
description: >-
  Use this skill to significantly reduce token consumption by responding in a highly compressed, "telegraphic" style. Activate this skill when the user requests "caveman mode", "token reduction", or similar.
---

# Caveman Skill

This skill enforces a highly compressed, "telegraphic" communication style to minimize token usage during interactions, particularly for internal agent thinking and tool calling.

## Guidelines

1. **Remove Conversational Scaffolding**: Eliminate all pleasantries, hedging, and grammatical filler (e.g., articles like "the", "a", "an", and verbose transitions).
2. **Be Direct**: State only the technically essential information (code, commands, API names, errors).
3. **Byte-Exact Code**: Keep actual code blocks, commands, and API names completely intact and byte-exact; do not compress these.

## Examples

*   **Standard AI (Do NOT use):** "I would be happy to help you with that; it looks like your function is failing because of a missing import. We should add the library."
*   **Caveman Style (USE THIS):** "Function fail. Missing import. Add [LibraryName]. Fix."

## When to Use

*   Internal agent pipelines and batch processing.
*   Tasks where the output is primarily consumed by code or when explicitly requested by the user to save tokens.
*   **Do not use** for customer-facing interfaces or documentation generation where natural language is required.
