package httpapi

// internalKeyValue is set at construction from config; package-level so the
// tiny comparison helper stays dependency-free for tests.
var internalKeyValue string
