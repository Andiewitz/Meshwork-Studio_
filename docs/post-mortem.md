# Post-Mortem: UI Interaction Bugs

## Date: February 25, 2026

## Issues Investigated and Fixed

### 1. Right-Click Context Menu Opening Workspace

**The Problem:**
When right-clicking on a workspace card in the Home page or Projects page to open the context menu, the workspace would automatically navigate/open instead of just showing the context menu.

**Root Cause:**
The `WorkspaceCard` component had an `onClick` handler that navigated to the workspace without checking which mouse button was clicked:

```tsx
onClick={() => !isRenaming && setLocation(`/workspace/${workspace.id}`)}
```

In some browsers/React event scenarios, right-clicks can trigger `onClick` handlers, especially when combined with how Radix UI handles pointer events on the `ContextMenuTrigger` element.

**The Fix:**
Added a check for the left mouse button (button 0) only:

```tsx
onClick={(e) => !isRenaming && e.button === 0 && setLocation(`/workspace/${workspace.id}`)}
```

**File Changed:** `client/src/components/workspace/WorkspaceCard.tsx`

---

### 2. Create New Workspace Dialog Closing on Input Click

**The Problem:**
When clicking on input fields inside the "Create New Workspace" dialog, the dialog would unexpectedly close.

**Root Cause:**
The `Dialog` component from Radix UI was set up to close when clicking outside (`onOpenChange` wired to `handleClose`). However, certain interactions with internal elements could trigger the pointer-down-outside detection unexpectedly.

**The Fix:**
Added explicit prevention of the close handlers for outside interactions:

```tsx
<DialogContent
  className="p-0 gap-0 border-0 max-w-2xl w-full overflow-hidden"
  style={{...}}
  onPointerDownOutside={(e) => e.preventDefault()}
  onInteractOutside={(e) => e.preventDefault()}
>
```

**File Changed:** `client/src/components/workspace/CreateWorkspaceDialog.tsx`

---

### 3. Featured Card Rename Closing on Input Click

**The Problem:**
When clicking on the rename input field in the FeaturedCard (the hero workspace card), it would close or trigger navigation instead of staying in edit mode.

**Root Cause:**
The rename input in `FeaturedCard` was missing the click event protection that `WorkspaceCard` had. Click events were bubbling up to parent elements that might have their own click handlers.

**The Fix:**
Added `onClick={(e) => e.stopPropagation()}` to prevent click events from bubbling up:

```tsx
<input
  ref={inputRef}
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  onBlur={handleRename}
  onKeyDown={(e) => {...}}
  onClick={(e) => e.stopPropagation()}  // Added this
  className="..."
/>
```

**File Changed:** `client/src/components/workspace/FeaturedCard.tsx`

---

## Key Takeaways

1. **Event handling in React requires specificity** - Always check which mouse button triggered an action if you want different behaviors for left vs right clicks.

2. **Dialog components need careful configuration** - Radix UI dialogs have multiple interaction points that can trigger closing; understand `onPointerDownOutside` and `onInteractOutside` when you need to prevent accidental closes.

3. **Event bubbling is easy to miss** - When inline editing inputs are children of clickable elements, always use `stopPropagation()` to prevent parent handlers from firing.

4. **Consistency across components** - The `WorkspaceCard` had proper event handling that `FeaturedCard` lacked. When components share similar functionality, ensure they share similar event handling patterns.
