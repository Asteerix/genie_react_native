package utils

import "time"

// DurationToMilliseconds convertit une durée time.Duration en millisecondes (int64)
func DurationToMilliseconds(d time.Duration) int64 {
	return d.Milliseconds()
}

// MillisecondsToDuration convertit une valeur en millisecondes en time.Duration
func MillisecondsToDuration(ms int64) time.Duration {
	return time.Duration(ms) * time.Millisecond
}