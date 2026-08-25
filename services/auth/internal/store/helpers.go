package store

// nilIfEmpty maps "" to SQL NULL for nullable varchar columns.
func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
