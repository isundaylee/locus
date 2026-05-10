# TODO

- [ ] **Totals strip should count implied defaults.** Right now `tallyDays` counts each day's `status` and `location` from the derived value, but weekday-with-no-row days have `status: null` and fall into "Unmarked" rather than being treated as the implied `working` default. Decide whether the implied default for an unmarked weekday is `working` and update either `deriveDay` (to set the status default) or `tallyDays` (to attribute the null-status weekday to working). Make sure the calendar visual stays in sync with whatever the totals claim.
