package scripts

import (
	"encoding/json"

	"go.starlark.net/starlark"
)

func interfaceToValue(v interface{}) starlark.Value {
	switch v.(type) {
	case string:
		return starlark.String(v.(string))
	case float64:
		temp := v.(float64)
		if temp == float64(int64(temp)) {
			return starlark.MakeInt64(int64(temp))
		} else {
			return starlark.Float(temp)
		}
	case bool:
		return starlark.Bool(v.(bool))
	case nil:
		return starlark.None
	case map[string]interface{}:
		return mapToDict(v.(map[string]interface{}))
	case []interface{}:
		return arrayToList(v.([]interface{}))
	}

	return starlark.None
}

func mapToDict(m map[string]interface{}) *starlark.Dict {
	dict := starlark.NewDict(len(m))
	for k, v := range m {
		dict.SetKey(starlark.String(k), interfaceToValue(v))
	}

	return dict
}

func arrayToList(a []interface{}) *starlark.List {
	res := make([]starlark.Value, len(a))
	for i, v := range a {
		res[i] = interfaceToValue(v)
	}

	return starlark.NewList(res)
}

func valueToInterface(v starlark.Value) interface{} {
	switch v := v.(type) {
	case starlark.String:
		return string(v)
	case starlark.Int:
		i, _ := v.Int64()
		return i
	case starlark.Float:
		return float64(v)
	case starlark.Bool:
		return bool(v)
	case starlark.NoneType:
		return nil
	case *starlark.Dict:
		return dictToMap(v)
	case *starlark.List:
		return listToArray(v)
	}

	return nil
}

func dictToMap(d *starlark.Dict) map[string]interface{} {
	res := make(map[string]interface{})

	for _, item := range d.Items() {
		key := item.Index(0)
		value := item.Index(1)

		if s, ok := starlark.AsString(key); ok {
			res[s] = valueToInterface(value)
		}
	}

	return res
}

func listToArray(l *starlark.List) []interface{} {
	res := make([]interface{}, l.Len())
	for i := 0; i < l.Len(); i++ {
		res[i] = valueToInterface(l.Index(i))
	}
	return res
}

func deserializeValue(value starlark.Value, t interface{}) {
	v := valueToInterface(value)
	if v != nil {
		serialized, err := json.Marshal(v)
		if err == nil {
			json.Unmarshal(serialized, t)
		}
	}
}
