package command

import "testing"

func TestMessageURLRegex(t *testing.T) {
	for _, url := range []string{
		"https://discord.com/channels/1/2/3",
		"https://ptb.discord.com/channels/1/2/3",
		"https://canary.discord.com/channels/1/2/3",
		"https://discordapp.com/channels/1/2/3",
	} {
		m := messageURLRegex.FindStringSubmatch(url)
		if m == nil || m[1] != "2" || m[2] != "3" {
			t.Errorf("%s: match = %v", url, m)
		}
	}
}
