package wire

type AuthExchangeRequestWire struct {
	Code string `json:"code"`
}

type AuthExchangeResponseDataWire struct {
	AccessToken  string `json:"access_token"`
	SessionToken string `json:"session_token"`
}

type AuthExchangeResponseWire APIResponse[AuthExchangeResponseDataWire]
