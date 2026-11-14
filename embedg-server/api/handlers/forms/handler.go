package forms

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

type FormsHandler struct {
	formStore    store.FormStore
	am           *access.AccessManager
	planStore    store.PlanStore
	actionParser *parser.ActionParser
}

func New(
	formStore store.FormStore,
	am *access.AccessManager,
	planStore store.PlanStore,
	actionParser *parser.ActionParser,
) *FormsHandler {
	return &FormsHandler{
		formStore:    formStore,
		am:           am,
		planStore:    planStore,
		actionParser: actionParser,
	}
}

func (h *FormsHandler) HandleListForms(c *fiber.Ctx) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	forms, err := h.formStore.GetForms(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	res := make([]wire.FormWire, len(forms))
	for i, form := range forms {
		res[i] = formToWire(form)
	}

	return c.JSON(wire.FormsListResponseWire{
		Success: true,
		Data:    res,
	})
}

func (h *FormsHandler) HandleGetForm(c *fiber.Ctx) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	form, err := h.formStore.GetForm(c.UserContext(), guildID, c.Params("formID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("form_not_found", "No form found with this ID")
		}
		return err
	}

	return c.JSON(wire.FormGetResponseWire{
		Success: true,
		Data:    formToWire(*form),
	})
}

func (h *FormsHandler) HandleCreateForm(c *fiber.Ctx, req wire.FormSaveRequestWire) error {
	session := c.Locals("session").(*session.Session)
	req.Normalize()

	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	fields, actionSet, err := h.checkForm(c, guildID, req)
	if err != nil {
		return err
	}

	existingCount, err := h.formStore.CountForms(c.UserContext(), guildID)
	if err != nil {
		return err
	}
	if int(existingCount) >= actions.MaxFormsPerGuild {
		return handlers.Forbidden("form_limit", fmt.Sprintf("A server can have up to %d forms.", actions.MaxFormsPerGuild))
	}

	derivedPerms, err := h.derivePermissionsForUser(c, session, guildID)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	form, err := h.formStore.CreateForm(c.UserContext(), model.Form{
		ID:                 common.InternalID(),
		GuildID:            guildID,
		Name:               req.Name,
		Title:              req.Title,
		Fields:             fields,
		Actions:            actionSet,
		DerivedPermissions: &derivedPerms,
		CreatedAt:          now,
		UpdatedAt:          now,
	})
	if err != nil {
		return err
	}

	return c.JSON(wire.FormCreateResponseWire{
		Success: true,
		Data:    formToWire(*form),
	})
}

func (h *FormsHandler) HandleUpdateForm(c *fiber.Ctx, req wire.FormSaveRequestWire) error {
	session := c.Locals("session").(*session.Session)
	req.Normalize()

	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	fields, actionSet, err := h.checkForm(c, guildID, req)
	if err != nil {
		return err
	}

	derivedPerms, err := h.derivePermissionsForUser(c, session, guildID)
	if err != nil {
		return err
	}

	form, err := h.formStore.UpdateForm(c.UserContext(), model.Form{
		ID:                 c.Params("formID"),
		GuildID:            guildID,
		Name:               req.Name,
		Title:              req.Title,
		Fields:             fields,
		Actions:            actionSet,
		DerivedPermissions: &derivedPerms,
		UpdatedAt:          time.Now().UTC(),
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("form_not_found", "No form found with this ID")
		}
		return err
	}

	return c.JSON(wire.FormUpdateResponseWire{
		Success: true,
		Data:    formToWire(*form),
	})
}

func (h *FormsHandler) HandleDeleteForm(c *fiber.Ctx) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	_, err = h.formStore.DeleteForm(c.UserContext(), guildID, c.Params("formID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("form_not_found", "No form found with this ID")
		}
		return err
	}

	return c.JSON(wire.FormDeleteResponseWire{
		Success: true,
	})
}

// checkForm validates what a request has for a form against Discord's limits for modals and the
// plan of the server, and returns the fields and actions in the shape they're stored in.
func (h *FormsHandler) checkForm(c *fiber.Ctx, guildID common.ID, req wire.FormSaveRequestWire) ([]actions.FormField, actions.ActionSet, error) {
	fields := make([]actions.FormField, len(req.Fields))
	for i, f := range req.Fields {
		fields[i] = fieldFromWire(f)
	}

	if err := actions.ValidateForm(req.Name, req.Title, fields); err != nil {
		return nil, actions.ActionSet{}, handlers.BadRequest("invalid_form", fmt.Sprintf("Invalid form: %s.", err))
	}

	actionSet := actions.ActionSet{}
	if len(req.Actions) != 0 && string(req.Actions) != "null" {
		if err := json.Unmarshal(req.Actions, &actionSet); err != nil {
			return nil, actions.ActionSet{}, handlers.BadRequest("invalid_actions", fmt.Sprintf("Invalid actions: %s", err))
		}
	}

	if err := actions.ValidateFormActionSet(actionSet); err != nil {
		return nil, actions.ActionSet{}, handlers.BadRequest("invalid_actions", fmt.Sprintf("Invalid actions: %s.", err))
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID)
	if err != nil {
		return nil, actions.ActionSet{}, err
	}

	if err := handlers.CheckActionSetLimit(actionSet, features); err != nil {
		return nil, actions.ActionSet{}, err
	}

	return fields, actionSet, nil
}

// derivePermissionsForUser records the authority the requesting user has over the form's actions,
// resolving their member with their own OAuth token.
func (h *FormsHandler) derivePermissionsForUser(c *fiber.Ctx, session *session.Session, guildID common.ID) (actions.ActionDerivedPermissions, error) {
	member, err := h.am.GetMemberForUser(c.UserContext(), session, guildID)
	if err != nil {
		return actions.ActionDerivedPermissions{}, fmt.Errorf("Failed to get member: %w", err)
	}

	derivedPerms, err := h.actionParser.DerivePermissionsForActions(c.UserContext(), *member, guildID, 0)
	if err != nil {
		return actions.ActionDerivedPermissions{}, handlers.BadRequest("invalid_actions", err.Error())
	}

	return derivedPerms, nil
}

func formToWire(form model.Form) wire.FormWire {
	fields := make([]wire.FormFieldWire, len(form.Fields))
	for i, f := range form.Fields {
		fields[i] = fieldToWire(f)
	}

	return wire.FormWire{
		ID:        form.ID,
		Name:      form.Name,
		Title:     form.Title,
		Fields:    fields,
		Actions:   form.Actions,
		CreatedAt: form.CreatedAt,
		UpdatedAt: form.UpdatedAt,
	}
}

func fieldFromWire(f wire.FormFieldWire) actions.FormField {
	options := make([]actions.FormFieldOption, len(f.Options))
	for i, o := range f.Options {
		options[i] = actions.FormFieldOption(o)
	}

	return actions.FormField{
		Key:         f.Key,
		Type:        f.Type,
		Label:       f.Label,
		Placeholder: f.Placeholder,
		Value:       f.Value,
		Paragraph:   f.Paragraph,
		Required:    f.Required,
		MinLength:   f.MinLength,
		MaxLength:   f.MaxLength,
		MaxValues:   f.MaxValues,
		Options:     options,
		Default:     f.Default,
	}
}

func fieldToWire(f actions.FormField) wire.FormFieldWire {
	options := make([]wire.FormFieldOptionWire, len(f.Options))
	for i, o := range f.Options {
		options[i] = wire.FormFieldOptionWire(o)
	}

	return wire.FormFieldWire{
		Key:         f.Key,
		Type:        f.Type,
		Label:       f.Label,
		Placeholder: f.Placeholder,
		Value:       f.Value,
		Paragraph:   f.Paragraph,
		Required:    f.Required,
		MinLength:   f.MinLength,
		MaxLength:   f.MaxLength,
		MaxValues:   f.MaxValues,
		Options:     options,
		Default:     f.Default,
	}
}
