package lockout

import "testing"

func TestBackoffProgression(t *testing.T) {
	cases := []struct {
		failures int
		wantMin  int
	}{
		{1, 0},  // no lock below threshold+1
		{5, 0},  // exactly at threshold: not locked yet
		{6, 15}, // first lock
		{7, 30},
		{8, 60},
		{9, 120},
		{11, 480},
	}
	for _, tc := range cases {
		got := backoffMinutes(tc.failures)
		if got != tc.wantMin {
			t.Errorf("backoffMinutes(%d) = %d, want %d", tc.failures, got, tc.wantMin)
		}
	}
}

func TestBackoffOverflowSafe(t *testing.T) {
	// An attacker hammering thousands of failures must stay capped at 8h,
	// never overflow into negative/zero durations.
	if got := backoffMinutes(100000); got != maxLockMinutes {
		t.Errorf("extreme failures = %d minutes, want cap %d", got, maxLockMinutes)
	}
}
