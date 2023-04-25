package premium

type Plan struct {
	ID      string `json:"id"`
	PriceID string `json:"price_id"`
}

type PlanInfo struct {
	ServerCount int `json:"server_count"`
}

func (p *Plan) Info() PlanInfo {
	serverCount := 0

	switch p.ID {
	case "premium_1":
		serverCount = 1
	case "premium_2":
		serverCount = 2
	case "premium_4":
		serverCount = 4
	case "premium_8":
		serverCount = 8
	}

	return PlanInfo{
		ServerCount: serverCount,
	}
}
