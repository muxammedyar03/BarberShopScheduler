package query

// DQuery mirrors Next.js Collections layer (Link_app hr_employees pattern).
type DQuery struct {
	Type   string   `json:"__type"` // list | table
	From   int      `json:"from"`
	Size   int      `json:"size"`
	Init   *int     `json:"init,omitempty"`
	Fields []DField `json:"fields"`
}

type DField struct {
	Name string `json:"name"`
	Text string `json:"text,omitempty"`
	Sort string `json:"sort,omitempty"` // asc | desc

	String      *string  `json:"string,omitempty"`
	Number      *float64 `json:"number,omitempty"`
	Numbers     []float64 `json:"numbers,omitempty"`
	Checkbox    *bool    `json:"checkbox,omitempty"`

	Checkboxes *CheckboxFilter `json:"checkboxes,omitempty"`
	Checkbuttons *CheckFilter  `json:"checkbuttons,omitempty"`
	Range      *RangeFilter    `json:"range,omitempty"`
	Select     *SelectFilter   `json:"select,omitempty"`
}

type CheckboxFilter struct {
	Type   string   `json:"type"`
	Values []string `json:"values"`
}

type CheckFilter struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type RangeFilter struct {
	Type string  `json:"type"` // date | number
	From *string `json:"from,omitempty"`
	To   *string `json:"to,omitempty"`
}

type SelectFilter struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// DCollate is the paginated list response.
type DCollate[T any] struct {
	Total    int64          `json:"total"`
	Filtered int64          `json:"filtered"`
	Data     []T            `json:"data"`
	Query    DQuery         `json:"query"`
	Summary  map[string]int `json:"summary"`
}

type CollateRequest struct {
	Query DQuery `json:"query"`
	// Optional static WHERE from resource handler, e.g. barber_id = $n
	Where map[string]any `json:"where,omitempty"`
}
