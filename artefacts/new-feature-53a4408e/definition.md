# Definition: Mock Fixture Feature

**Status:** Approved (mock fixture — bri-s3.1)
**Feature slug:** mock-fixture-feature
**Date:** 2026-07-10
**Skill version:** /definition

# Epic 1: Mock Epic

## Stories in this epic
- mock-fixture.1

# Story mock-fixture.1 — Mock story
Complexity: 1

AC1: Fixture-driven definition completes deterministically.

A CANVAS-JSON program-design marker (csd-s3, added 2026-07-26) precedes the artefact block, so the definition stage's canvas panel also has real content to render -- this fixture predated csd-s3/csd-s4's marker-emission convention by two weeks, which meant staging's mocked /definition sessions never rendered a diagram until this fix. The H1 Epic/Story header format and dot-separated story ID (dtra-s1/dsda-s1, added 2026-07-26) replace the original H2/H3 headers and hyphenated "mock-story-1" ID, which extractStoryIdsFromDefinitionArtefact never recognised -- meaning staging's mocked /definition sessions always fell back to the manual story-list confirm page, a second real gap found from the same stale-fixture root cause as the missing canvas marker.