package send_message

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"testing"

	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
)

func TestSendInvalidMessage(t *testing.T) {
	h := &SendMessageHandler{}
	req := wire.MessageSendToWebhookRequestWire{
		Data: json.RawMessage(`{"embeds":[{"title":"a","timestamp":"tomorrow"}]}`),
	}

	_, err := run(t, func(c *fiber.Ctx) error { return h.HandleSendMessageToWebhook(c, req) })
	var wErr *wire.Error
	if !errors.As(err, &wErr) || wErr.Status != http.StatusBadRequest || wErr.Code != "invalid_message" {
		t.Fatalf("err = %v, want a 400 invalid_message", err)
	}
}

func TestEditsComponentsV2ToLegacy(t *testing.T) {
	cv2 := &rest.Error{Code: 50035, Errors: json.RawMessage(`{"embeds":{"_errors":[{"code":"MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2","message":"The 'embeds' field cannot be used when using MessageFlags.IS_COMPONENTS_V2"}]}}`)}
	if !editsComponentsV2ToLegacy(fmt.Errorf("failed to edit: %w", cv2)) {
		t.Error("components v2 rejection not recognized")
	}

	other := &rest.Error{Code: 50035, Errors: json.RawMessage(`{"username":{"_errors":[{"code":"USERNAME_INVALID"}]}}`)}
	if editsComponentsV2ToLegacy(other) {
		t.Error("unrelated invalid form body taken for a components v2 rejection")
	}
}
