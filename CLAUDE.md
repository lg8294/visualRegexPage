# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Visual Regex Page is a regex visualization tool at [https://wangwl.net/r/vr](https://wangwl.net/r/vr). It visualizes regular expressions graphically and allows testing regex against input strings with various methods (exec, test, match, search, replace, split).

## Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server (Vite)
pnpm build      # Build for production
pnpm preview    # Preview production build
```

## Architecture

### Reactive Data Flow (RxJS)

The core architecture uses RxJS observables to manage reactive state:

1. **`regexObservable.js`** - Creates a `regexChanged` observable that:
   - Combines `sourceObservable` (user regex input) with `flagsObservable` (g/i/m/u/y checkboxes)
   - Creates a `RegExp` object and emits it (or `null` if invalid)
   - Uses `publishBehavior` + `refCount` for multicasting

2. **`regexChange.js`** - Subscribes to combined observables:
   - `regexChanged` - the RegExp object
   - `matchValueObservable` - test string input
   - `methodValueObservable` - selected regex method
   - `replacementObservable` - replacement string for replace method
   - Uses `visualRegex` library to render regex visualization (canvas + DOM)
   - Uses `highlight.js` to syntax-highlight match results

### State Management

**`hash.js`** manages URL hash state for shareable links:
- Encodes regex source, flags, test string, method into URL hash
- Uses prefix encoding to compress predefined regex patterns in URL
- `getInitHash()` / `setHash()` functions

### Predefined Patterns

**`predefined.js`** exports predefined regex patterns (URL, email, phone, ID card, etc.) used by the sidebar.

### Regex Methods

**`matcher.js`** is a simple wrapper mapping method names (exec, test, match, search, replace, split) to their corresponding RegExp/String methods.

### Styling

Uses LESS with CSS modules configured for global scope behavior. Files:
- `src/less/common.less` - Reset and common styles
- `src/less/index.module.less` - Main component styles (imported as `cls`)
- `src/less/*.less` - Feature-specific styles (nav, aside, visualDom, etc.)

## Key Libraries

- **visual-regex** - Generates visual regex diagrams
- **relax-dom** - DOM manipulation utility (similar to jQuery)
- **relax-utils** - Utility functions (isIE, isPc, htmlEncode, parseParam, etc.)
- **rxjs** - Reactive extensions for observables
- **highlight.js** - Syntax highlighting for match results
