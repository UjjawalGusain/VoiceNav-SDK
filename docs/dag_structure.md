# Dag.md -- VoiceNav DAG Specification

This document describes the structure and semantics of a **single `dag.json` object** used by VoiceNav.
The DAG defines **all valid navigation states, UI components, and transitions** allowed in the application.

The DAG is treated as the **single source of truth** for navigation and execution planning.

---

## Top-Level DAG Object
```
{
"id": "string",
"version": "string",
"description": "string",
"nodes": ...
}
```
---

### Fields

- `id` (`string`)  
  Unique identifier for the DAG (UUID is recommended).

- `version` (`string`)  
  Version of the DAG definition (used for compatibility and migrations).

- `description` (`string`)  
  Human-readable explanation of what this DAG represents.

- `nodes` (`array`)  
  List of all pages and components in the application.

---

## Nodes Array

Each entry in `nodes` represents **one navigable entity** in the application.
```
{
"id": "string",
"type": "page" | "component",
"title": "string",
"routeHint": { ... },
"domHints": { ... },
"description": "string",
"edges": ...
}
```
---
## Node Fields

### id

- Type: `string`  
- Required  
- Must be globally unique within the DAG  
- Used as the target for edges  

```
"id": "22222222-2222-2222-2222-222222222222"
```

---

### type

- Type: `"page"` or `"component"`  
- Required  

**page**
- Represents a full screen or route
- Typically involves URL changes

**component**
- Represents an inline UI element
- Exists within a page context

```
"type": "page"
```

---

### title

- Type: `string`  
- Required  
- Human-readable name for debugging and tooling  

```
"title": "Dashboard"
```

---

### description

- Type: `string`  
- Optional  
- Explains the purpose of the node  

```
"description": "Main user dashboard after login"
```

---

## routeHint

Used to verify that the **current route matches the node**\.

```
"routeHint": {
"pattern": "/dashboard",
"match": "prefix"
}
```

### Fields

- `pattern` (`string`)  
  Route pattern (e.g. `/login`, `/user/:id`)

- `match` (`exact` | `prefix` | `regex`)  
  Optional matching strategy  
  Default: `exact`

### Match Modes

- `exact`  
  Full route must match exactly

- `prefix`  
  Current route must start with the pattern

- `regex`  
  Pattern is evaluated as a regular expression

---

## domHints

DOM-level validation rules to confirm correct UI state.

```
"domHints": {
"mustContain": "dashboard", "overview",
"mustNotContain": "login"
}
```

### Fields

- `mustContain` (`string[]`)  
  Elements or tokens that must exist in the DOM

- `mustNotContain` (`string[]`)  
  Elements or tokens that must not exist

### Purpose

- Prevent incorrect page detection  
- Ensure UI readiness  
- Avoid invalid action execution  

---

## edges

Defines **allowed outgoing transitions** from the node.


```
"edges": { "label": "open_settings", "target": "44444444-4444-4444-4444-444444444444", "transition": "soft" }
```

---

## Edge Fields

### label

- Type: `string`  
- Required  
- Represents the user intent or action name  


```
"label": "submit_credentials"
```

---

### target

- Type: `string`  
- Required  
- Must reference the `id` of another node  

```
"target": "22222222-2222-2222-2222-222222222222"
```

---

### transition

- Type: `"soft"` or `"hard"`  
- Required  

**soft**
- No full navigation
- DOM-level interaction only
- Examples: modals, panels, inline edits

**hard**
- Full route change
- Page navigation or redirect
- Examples: login redirect, transaction steps

```
"transition": "hard"
```

---

## Terminal Nodes

A node may have no outgoing edges.

```
"edges":
```

Such nodes represent **end states** in the DAG.

---

## Structural Rules

- The graph **must be acyclic**
- Every edge target must exist
- Components must be reachable from a page
- Navigation outside the DAG is forbidden

---

## VoiceNav Execution Semantics

- The DAG is authoritative
- Agents must:
  - Match `routeHint`
  - Validate `domHints`
  - Follow declared `edges` only
- Any deviation is an execution error




