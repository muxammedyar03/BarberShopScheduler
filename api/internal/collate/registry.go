package collate

// Resource defines allowlisted columns for safe dynamic SQL.
type Resource struct {
	Table       string
	FromClause  string // optional full FROM (with joins); defaults to Table
	Select      string // e.g. "SELECT * FROM barbers"
	SearchExpr  string // ILIKE expression, e.g. "(name ILIKE $%d OR phone ILIKE $%d)"
	Columns     map[string]ColumnDef
	DefaultSort string
}

type ColumnDef struct {
	DBColumn string
	Kind     FilterKind
}

type FilterKind int

const (
	KindString FilterKind = iota
	KindSearch
	KindCheckboxes
	KindCheckbuttons
	KindDateRange
	KindNumberRange
	KindSort
)

var Registry = map[string]Resource{
	"barbers": {
		Table:       "barbers",
		Select:      "SELECT * FROM barbers",
		SearchExpr:  "(name ILIKE $%d OR phone ILIKE $%d)",
		DefaultSort: "name ASC",
		Columns: map[string]ColumnDef{
			"name":            {DBColumn: "name", Kind: KindSort},
			"search":          {DBColumn: "name", Kind: KindSearch},
			"status":          {DBColumn: "status", Kind: KindCheckboxes},
			"payment_status":  {DBColumn: "payment_status", Kind: KindCheckboxes},
			"is_active":       {DBColumn: "is_active", Kind: KindCheckbuttons},
			"is_blocked":      {DBColumn: "is_blocked", Kind: KindCheckbuttons},
			"monthly_fee":     {DBColumn: "monthly_fee", Kind: KindNumberRange},
			"city":            {DBColumn: "city", Kind: KindCheckboxes},
		},
	},
	"appointments": {
		Table:       "appointments",
		Select:      "SELECT * FROM appointments",
		SearchExpr:  "(client_name ILIKE $%d OR client_phone ILIKE $%d)",
		DefaultSort: "date ASC, start_time ASC",
		Columns: map[string]ColumnDef{
			"search":     {DBColumn: "client_name", Kind: KindSearch},
			"barber_id":  {DBColumn: "barber_id", Kind: KindCheckboxes},
			"status":     {DBColumn: "status", Kind: KindCheckboxes},
			"category":   {DBColumn: "category", Kind: KindCheckboxes},
			"date":       {DBColumn: "date", Kind: KindDateRange},
			"price":      {DBColumn: "price", Kind: KindNumberRange},
			"start_time": {DBColumn: "start_time", Kind: KindSort},
		},
	},
	"users": {
		Table:       "users",
		Select:      "SELECT id, email, display_name, photo_url, role, barber_id, created_at, updated_at FROM users",
		SearchExpr:  "(email ILIKE $%d OR display_name ILIKE $%d)",
		DefaultSort: "display_name ASC NULLS LAST",
		Columns: map[string]ColumnDef{
			"search": {DBColumn: "email", Kind: KindSearch},
			"role":   {DBColumn: "role", Kind: KindCheckboxes},
			"email":  {DBColumn: "email", Kind: KindSort},
		},
	},
	"invoices": {
		Table:       "invoices",
		Select:      "SELECT * FROM invoices",
		SearchExpr:  "(barber_name ILIKE $%d)",
		DefaultSort: "due_date DESC",
		Columns: map[string]ColumnDef{
			"search":    {DBColumn: "barber_name", Kind: KindSearch},
			"barber_id": {DBColumn: "barber_id", Kind: KindCheckboxes},
			"status":    {DBColumn: "status", Kind: KindCheckboxes},
			"due_date":  {DBColumn: "due_date", Kind: KindDateRange},
			"amount":    {DBColumn: "amount", Kind: KindNumberRange},
		},
	},
	"cash_logs": {
		Table:       "cash_logs",
		Select:      "SELECT * FROM cash_logs",
		SearchExpr:  "(category ILIKE $%d OR description ILIKE $%d)",
		DefaultSort: "date DESC",
		Columns: map[string]ColumnDef{
			"search":    {DBColumn: "category", Kind: KindSearch},
			"barber_id": {DBColumn: "barber_id", Kind: KindCheckboxes},
			"type":      {DBColumn: "type", Kind: KindCheckboxes},
			"date":      {DBColumn: "date", Kind: KindDateRange},
			"amount":    {DBColumn: "amount", Kind: KindNumberRange},
		},
	},
}
