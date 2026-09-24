package premium

import (
	"context"
	"slices"
	"testing"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

const (
	testGuildID = common.ID(1)
	testRoleID  = common.ID(2)
	testUserID  = common.ID(3)
	premiumSKU  = "premium-sku"
	freeSKU     = "free-sku"
)

type fakeEntitlementStore struct {
	store.EntitlementStore
	skuID string
}

func (s *fakeEntitlementStore) GetEntitledUserIDs(ctx context.Context) ([]common.ID, error) {
	return []common.ID{testUserID}, nil
}

func (s *fakeEntitlementStore) GetActiveEntitlementsForUser(ctx context.Context, userID common.ID) ([]model.Entitlement, error) {
	return []model.Entitlement{{ID: s.skuID, SkuID: s.skuID}}, nil
}

type fakeRest struct {
	rest.Rest
	member    *discord.Member
	memberErr error
	added     []common.ID
	removed   []common.ID
}

func (r *fakeRest) GetMember(guildID, userID common.ID, opts ...rest.RequestOpt) (*discord.Member, error) {
	return r.member, r.memberErr
}

func (r *fakeRest) AddMemberRole(guildID, userID, roleID common.ID, opts ...rest.RequestOpt) error {
	r.added = append(r.added, userID)
	return nil
}

func (r *fakeRest) RemoveMemberRole(guildID, userID, roleID common.ID, opts ...rest.RequestOpt) error {
	r.removed = append(r.removed, userID)
	return nil
}

func newTestManager(skuID string, r *fakeRest) *PremiumManager {
	return &PremiumManager{
		memberRequestInterval: time.Microsecond,
		config: Config{
			BeneficialGuildID: testGuildID,
			BeneficialRoleID:  testRoleID,
			Plans: []model.Plan{
				{SKUID: freeSKU},
				{SKUID: premiumSKU, Features: model.PlanFeatures{IsPremium: true}},
			},
		},
		rest:             r,
		entitlementStore: &fakeEntitlementStore{skuID: skuID},
	}
}

func TestAssignPremiumRoles(t *testing.T) {
	data := []struct {
		Name        string
		SkuID       string
		Member      *discord.Member
		MemberErr   error
		WantAdded   []common.ID
		WantRemoved []common.ID
	}{
		{
			Name:      "grants the role to a premium user without it",
			SkuID:     premiumSKU,
			Member:    &discord.Member{},
			WantAdded: []common.ID{testUserID},
		},
		{
			Name:        "strips the role from a user that isn't premium",
			SkuID:       freeSKU,
			Member:      &discord.Member{RoleIDs: []common.ID{testRoleID}},
			WantRemoved: []common.ID{testUserID},
		},
		{
			Name:   "leaves a premium user that already has the role alone",
			SkuID:  premiumSKU,
			Member: &discord.Member{RoleIDs: []common.ID{testRoleID}},
		},
		{
			Name:      "skips a user that isn't in the guild",
			SkuID:     premiumSKU,
			MemberErr: &rest.Error{Code: rest.JSONErrorCodeUnknownMember},
		},
	}

	for _, d := range data {
		t.Run(d.Name, func(t *testing.T) {
			r := &fakeRest{member: d.Member, memberErr: d.MemberErr}

			if err := newTestManager(d.SkuID, r).assignPremiumRoles(context.Background()); err != nil {
				t.Fatalf("assignPremiumRoles: %v", err)
			}

			if !slices.Equal(r.added, d.WantAdded) {
				t.Fatalf("added = %v, want %v", r.added, d.WantAdded)
			}
			if !slices.Equal(r.removed, d.WantRemoved) {
				t.Fatalf("removed = %v, want %v", r.removed, d.WantRemoved)
			}
		})
	}
}

// a cancelled sweep stops where it is rather than walking the rest of the list
func TestAssignPremiumRolesCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	r := &fakeRest{member: &discord.Member{}}
	m := newTestManager(premiumSKU, r)
	m.memberRequestInterval = time.Hour

	if err := m.assignPremiumRoles(ctx); err != nil {
		t.Fatalf("assignPremiumRoles: %v", err)
	}
	if len(r.added) != 0 {
		t.Fatalf("added = %v, want nothing after a cancel", r.added)
	}
}
