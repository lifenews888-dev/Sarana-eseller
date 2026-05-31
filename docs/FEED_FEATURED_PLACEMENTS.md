# Feed Featured Placements

The feed page has one marketplace stream. Featured business cards are not a separate category system.

## Source Of Truth

- Public listings are created in `/feed/post` and stored as feed items.
- Paid placement uses the feed item's `tier`.
- `tier=featured` can appear in the "Онцлох бизнесүүд" strip when the item belongs to a business entity such as `agent`, `company`, `auto_dealer`, `service`, or `store`.
- Demo cards are only fallback content and must be labelled as examples.

## Location Behavior

The feed can be filtered by district or province. Featured business placement should not disappear completely just because a user chose a strict location.

Resolution order:

1. Show matching `tier=featured` business items for the current filters.
2. If none match the chosen location, show featured business items from all locations while keeping a visible fallback note.
3. If production data has no featured business items yet, show labelled demo cards.

## Admin/Payment Model

The current launch-safe path is:

- seller creates a listing
- admin or paid placement workflow sets the listing to `tier=featured`
- the public feed renders it as an "Онцлох эрх" placement

This document does not add payment collection or wallet behavior. It only records the placement contract used by the public feed.
