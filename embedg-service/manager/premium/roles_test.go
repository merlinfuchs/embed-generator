package premium

import (
	"context"
	"testing"
	"time"

	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

const (
	testGuildID = common.ID(1)
	testRoleID  = common.ID(2)
	premiumSKU  = "premium-sku"
	freeSKU     = "free-sku"
)

type fakeEntitlementStore struct {
	store.EntitlementStore
	entitlements []model.Entitlement
}

func (s *fakeEntitlementStore) GetActiveEntitlements(ctx context.Context) ([]model.Entitlement, error) {
	return s.entitlements, nil
}

type fakePremiumRoleStore struct {
	assigned map[common.ID]struct{}
}

func (s *fakePremiumRoleStore) GetPremiumRoleAssignments(ctx context.Context) ([]common.ID, error) {
	userIDs := make([]common.ID, 0, len(s.assigned))
	for userID := range s.assigned {
		userIDs = append(userIDs, userID)
	}
	return userIDs, nil
}

func (s *fakePremiumRoleStore) UpsertPremiumRoleAssignment(ctx context.Context, userID common.ID, assignedAt time.Time) error {
	s.assigned[userID] = struct{}{}
	return nil
}

func (s *fakePremiumRoleStore) DeletePremiumRoleAssignment(ctx context.Context, userID common.ID) error {
	delete(s.assigned, userID)
	return nil
}

type fakeRest struct {
	rest.Rest
	added   []common.ID
	removed []common.ID
	addErr  error
}

func (r *fakeRest) AddMemberRole(guildID, userID, roleID common.ID, opts ...rest.RequestOpt) error {
	if r.addErr != nil {
		return r.addErr
	}
	r.added = append(r.added, userID)
	return nil
}

func (r *fakeRest) RemoveMemberRole(guildID, userID, roleID common.ID, opts ...rest.RequestOpt) error {
	r.removed = append(r.removed, userID)
	return nil
}

func entitlement(userID common.ID, skuID string) model.Entitlement {
	return model.Entitlement{
		ID:     skuID,
		UserID: common.NullID{Valid: true, ID: userID},
		SkuID:  skuID,
	}
}

func newManager(entitlements []model.Entitlement, assigned map[common.ID]struct{}, r *fakeRest) *PremiumManager {
	return &PremiumManager{
		config: Config{
			BeneficialGuildID: testGuildID,
			BeneficialRoleID:  testRoleID,
			Plans: []model.Plan{
				{ID: "free", SKUID: freeSKU, Default: true},
				{ID: "premium", SKUID: premiumSKU, Features: model.PlanFeatures{IsPremium: true}},
			},
		},
		rest:             r,
		entitlementStore: &fakeEntitlementStore{entitlements: entitlements},
		premiumRoleStore: &fakePremiumRoleStore{assigned: assigned},
	}
}

func TestAssignPremiumRoles(t *testing.T) {
	tests := []struct {
		name         string
		entitlements []model.Entitlement
		assigned     map[common.ID]struct{}
		addErr       error
		wantAdded    []common.ID
		wantRemoved  []common.ID
		wantAssigned []common.ID
	}{
		{
			name:         "grants the role to a newly entitled user",
			entitlements: []model.Entitlement{entitlement(10, premiumSKU)},
			assigned:     map[common.ID]struct{}{},
			wantAdded:    []common.ID{10},
			wantAssigned: []common.ID{10},
		},
		{
			name:         "strips the role once the entitlement is gone",
			entitlements: nil,
			assigned:     map[common.ID]struct{}{10: {}},
			wantRemoved:  []common.ID{10},
		},
		{
			name:         "leaves a user that already holds the role alone",
			entitlements: []model.Entitlement{entitlement(10, premiumSKU)},
			assigned:     map[common.ID]struct{}{10: {}},
			wantAssigned: []common.ID{10},
		},
		{
			name:         "ignores an entitlement whose plan isn't premium",
			entitlements: []model.Entitlement{entitlement(10, freeSKU)},
			assigned:     map[common.ID]struct{}{},
		},
		{
			name:         "doesn't record an assignment when the user isn't in the guild",
			entitlements: []model.Entitlement{entitlement(10, premiumSKU)},
			assigned:     map[common.ID]struct{}{},
			addErr:       &rest.Error{Code: rest.JSONErrorCodeUnknownMember},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &fakeRest{addErr: tt.addErr}
			m := newManager(tt.entitlements, tt.assigned, r)

			if err := m.assignPremiumRoles(context.Background()); err != nil {
				t.Fatalf("assignPremiumRoles: %v", err)
			}

			assertIDs(t, "added", r.added, tt.wantAdded)
			assertIDs(t, "removed", r.removed, tt.wantRemoved)

			assigned, _ := m.premiumRoleStore.GetPremiumRoleAssignments(context.Background())
			assertIDs(t, "assigned", assigned, tt.wantAssigned)
		})
	}
}

func assertIDs(t *testing.T, name string, got []common.ID, want []common.ID) {
	t.Helper()

	if len(got) != len(want) {
		t.Fatalf("%s = %v, want %v", name, got, want)
	}

	set := make(map[common.ID]struct{}, len(got))
	for _, id := range got {
		set[id] = struct{}{}
	}
	for _, id := range want {
		if _, ok := set[id]; !ok {
			t.Fatalf("%s = %v, want %v", name, got, want)
		}
	}
}
