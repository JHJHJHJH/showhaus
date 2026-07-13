# Include Area And Floor In Transaction Popup

Creation date: 2026-05-16

## Original Request

`$remember-plan include 'area' and 'floor' data in src/components/transaction/TransactionPopup.js.`

The `GET /tiles/land-context` endpoint returns TileJSON whose `ura-private-resi` vector layer includes price summary fields and matching area/floor fields such as `price_min_area`, `price_min_floor`, `price_p50_area`, and `price_p50_floor`.

## Final Plan

### Summary

Update `src/components/transaction/TransactionPopup.js` so land-context summary transactions populate the existing `Area` and `Floor` table columns from TileJSON properties.

### Key Changes

- Extend `summaryTransaction` to accept `area` and `floor` values and return them as `{ area, floor_range }`, matching the existing popup row render.
- Update `getSummaryDistribution` mappings:
  - `price_max_area` / `price_max_floor` for Highest
  - `price_p90_area` / `price_p90_floor` for 90th pct
  - `price_p50_area` / `price_p50_floor` for Median
  - `price_p10_area` / `price_p10_floor` for 10th pct
  - `price_min_area` / `price_min_floor` for Lowest
- Keep `latestTransaction` mapped only to `latest_price` and `latest_contract_date`, because the endpoint shape shown does not include latest area or floor fields.
- Preserve existing fallback behavior for non-summary transaction data from `transactionsDistribution`.

### Public Interfaces

- No endpoint, Redux, route, or component prop changes.
- Internal popup transaction objects will consistently use existing keys: `price`, `contract_date`, `area`, and `floor_range`.

### Test Plan

- Add a focused render test for summary distribution data so a mock land-context feature with `price_*_area` and `price_*_floor` renders area and floor in the popup table rows.
- Verify existing transaction rows still show `area` and `floor_range` from normal transaction data.
- Run the React test suite with `npm test -- --watchAll=false` or the project’s preferred equivalent.

### Assumptions

- Area values should render as the raw integer already used by the popup table, with no new unit formatting.
- Floor values from TileJSON should display in the existing `Floor` column via `floor_range`.
- The requested behavior is limited to transaction popup summary rows.
