// Command evalserver serves the AI assistant without a database, Discord or limits, so the eval in
// embedg-app/src/util/assistant.eval.test.ts can run the real prompts against the models. It uses
// OpenRouter if OPENROUTER_API_KEY is set, and OpenAI with OPENAI_API_KEY otherwise.
package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/assistant"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
)

func main() {
	addr := flag.String("addr", "localhost:4456", "address to listen on")
	modelName := flag.String("model", "gpt-5-mini", "model to use")
	effort := flag.String("effort", "low", "reasoning effort")
	maxRepairs := flag.Int("max-repairs", 2, "how often the model may fix its message")
	flag.Parse()

	opts := []option.RequestOption{option.WithAPIKey(os.Getenv("OPENAI_API_KEY"))}
	prefix := ""
	if key := os.Getenv("OPENROUTER_API_KEY"); key != "" {
		opts = []option.RequestOption{option.WithAPIKey(key), option.WithBaseURL("https://openrouter.ai/api/v1")}
		prefix = "openai/"
	}
	client := openai.NewClient(opts...)

	ai := assistant.New(&client, assistant.Config{
		Model:           prefix + *modelName,
		ReasoningEffort: *effort,
		MaxOutputTokens: 16000,
		MaxRepairs:      *maxRepairs,
	})

	// The app's wire types, plus the guild the server would load, and in the response the tokens
	// used and how long it took.
	http.HandleFunc("POST /chat", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			wire.AssistantChatRequestWire
			Guild evalGuild `json:"guild"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			fail(w, err)
			return
		}

		messages := make([]assistant.Message, len(req.Messages))
		for i, m := range req.Messages {
			messages[i] = assistant.Message{Role: m.Role, Content: m.Content}
		}
		start := time.Now()
		res, err := ai.Respond(r.Context(), assistant.Request{
			Message:  req.Message,
			Messages: messages,
			Guild:    req.Guild.toGuild(),
		})
		if err != nil {
			fail(w, err)
			return
		}

		fields := make([]wire.AssistantFieldWire, len(res.Fields))
		for i, f := range res.Fields {
			fields[i] = wire.AssistantFieldWire(f)
		}
		respond(w, struct {
			wire.AssistantChatResponseDataWire
			Eval evalInfo `json:"eval"`
		}{
			AssistantChatResponseDataWire: wire.AssistantChatResponseDataWire{
				Message:     res.Message,
				Data:        res.MessageJSON,
				BuildPrompt: res.BuildPrompt,
				Fields:      fields,
				Issues:      res.Issues,
				Repairs:     res.Repairs,
			},
			Eval: evalInfo{Model: *modelName, Tokens: res.Usage, MS: time.Since(start).Milliseconds()},
		})
	})

	log.Printf("Serving the AI assistant with %s on %s", *modelName, *addr)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

type evalGuild struct {
	Name          string                `json:"name"`
	Roles         []wire.GuildRoleWire  `json:"roles"`
	Emojis        []wire.GuildEmojiWire `json:"emojis"`
	SavedMessages []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"saved_messages"`
	Features wire.GetPremiumPlanFeaturesResponseDataWire `json:"features"`
}

func (g evalGuild) toGuild() assistant.Guild {
	guild := assistant.Guild{
		Name:   g.Name,
		HasBot: true,
		Features: model.PlanFeatures{
			ComponentsV2:           g.Features.ComponentsV2,
			ComponentTypes:         g.Features.ComponentTypes,
			MaxActionsPerComponent: g.Features.MaxActionsPerComponent,
		},
	}
	for _, r := range g.Roles {
		guild.Roles = append(guild.Roles, assistant.Role{ID: r.ID, Name: r.Name, Managed: r.Managed})
	}
	for _, e := range g.Emojis {
		guild.Emojis = append(guild.Emojis, assistant.Emoji{ID: e.ID, Name: e.Name, Animated: e.Animated})
	}
	for _, m := range g.SavedMessages {
		guild.SavedMessages = append(guild.SavedMessages, assistant.SavedMessage{ID: m.ID, Name: m.Name})
	}
	return guild
}

// evalInfo is added to responses for the eval's report.
type evalInfo struct {
	Model  string               `json:"model"`
	Tokens model.AssistantUsage `json:"tokens"`
	MS     int64                `json:"ms"`
}

func respond(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"success": true, "data": data})
}

func fail(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": false,
		"error":   map[string]any{"status": 500, "code": "eval_failed", "message": err.Error()},
	})
}
