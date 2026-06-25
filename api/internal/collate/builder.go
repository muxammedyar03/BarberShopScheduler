package collate

import (
	"fmt"
	"strings"

	"github.com/barber-queue/api/internal/query"
)

type built struct {
	where  string
	order  string
	args   []any
	argPos int
}

func nextArg(b *built, v any) int {
	b.argPos++
	b.args = append(b.args, v)
	return b.argPos
}

// Build turns DQuery + resource registry entry into COUNT + SELECT SQL.
// countArgs excludes LIMIT/OFFSET placeholders used only by dataSQL.
func Build(res Resource, q query.DQuery, extraWhere string, extraArgs []any) (countSQL, dataSQL string, countArgs, dataArgs []any, err error) {
	b := &built{argPos: 0, args: append([]any{}, extraArgs...)}
	if len(extraArgs) > 0 {
		b.argPos = len(extraArgs)
	}

	var clauses []string
	if extraWhere != "" {
		clauses = append(clauses, extraWhere)
	}

	sortField := ""
	sortDir := ""

	for _, f := range q.Fields {
		def, ok := res.Columns[f.Name]
		if !ok && f.Name != "search" {
			continue
		}
		if f.Sort == "asc" || f.Sort == "desc" {
			col := def.DBColumn
			if col == "" {
				col = f.Name
			}
			sortField = col
			sortDir = strings.ToUpper(f.Sort)
		}

		switch {
		case f.Name == "search" && f.String != nil && strings.TrimSpace(*f.String) != "":
			pat := "%" + strings.TrimSpace(*f.String) + "%"
			placeholderCount := strings.Count(res.SearchExpr, "$%d")
			if placeholderCount < 1 {
				placeholderCount = 2
			}
			args := make([]any, placeholderCount)
			placeholders := make([]any, placeholderCount)
			for i := 0; i < placeholderCount; i++ {
				placeholders[i] = nextArg(b, pat)
			}
			_ = args
			clauses = append(clauses, fmt.Sprintf(res.SearchExpr, placeholders...))

		case f.Checkboxes != nil && len(f.Checkboxes.Values) > 0:
			col := def.DBColumn
			if col == "" {
				col = f.Name
			}
			placeholders := make([]string, len(f.Checkboxes.Values))
			for i, v := range f.Checkboxes.Values {
				placeholders[i] = fmt.Sprintf("$%d", nextArg(b, v))
			}
			clauses = append(clauses, fmt.Sprintf("%s IN (%s)", col, strings.Join(placeholders, ",")))

		case f.Checkbuttons != nil && f.Checkbuttons.Value != "":
			col := def.DBColumn
			val := f.Checkbuttons.Value
			switch val {
			case "yes", "true", "1":
				clauses = append(clauses, fmt.Sprintf("%s = $%d", col, nextArg(b, true)))
			case "no", "false", "0":
				clauses = append(clauses, fmt.Sprintf("%s = $%d", col, nextArg(b, false)))
			default:
				clauses = append(clauses, fmt.Sprintf("%s::text = $%d", col, nextArg(b, val)))
			}

		case f.Range != nil:
			col := def.DBColumn
			if col == "" {
				col = f.Name
			}
			if f.Range.From != nil && *f.Range.From != "" {
				clauses = append(clauses, fmt.Sprintf("%s >= $%d", col, nextArg(b, *f.Range.From)))
			}
			if f.Range.To != nil && *f.Range.To != "" {
				clauses = append(clauses, fmt.Sprintf("%s <= $%d", col, nextArg(b, *f.Range.To)))
			}
			if f.Range.Type == "number" && f.Number != nil {
				clauses = append(clauses, fmt.Sprintf("%s >= $%d", col, nextArg(b, *f.Number)))
			}

		case f.Numbers != nil && len(f.Numbers) >= 2:
			col := def.DBColumn
			clauses = append(clauses, fmt.Sprintf("%s BETWEEN $%d AND $%d", col, nextArg(b, f.Numbers[0]), nextArg(b, f.Numbers[1])))
		}
	}

	whereSQL := ""
	if len(clauses) > 0 {
		whereSQL = " WHERE " + strings.Join(clauses, " AND ")
	}

	order := res.DefaultSort
	if sortField != "" {
		order = sortField + " " + sortDir
	}

	from := q.From
	size := q.Size
	if size <= 0 {
		size = 10
	}
	if size > 500 {
		size = 500
	}

	countArgs = append([]any{}, b.args...)

	limitArg := nextArg(b, size)
	offsetArg := nextArg(b, from)

	fromSQL := res.Table
	if res.FromClause != "" {
		fromSQL = res.FromClause
	}

	countSQL = fmt.Sprintf("SELECT COUNT(*) FROM %s%s", fromSQL, whereSQL)
	dataSQL = fmt.Sprintf("%s%s ORDER BY %s LIMIT $%d OFFSET $%d",
		res.Select, whereSQL, order, limitArg, offsetArg)

	dataArgs = b.args
	return countSQL, dataSQL, countArgs, dataArgs, nil
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// ExtraWhere builds "col = $1" with args for scoped queries.
func ExtraWhere(conditions map[string]any) (string, []any) {
	if len(conditions) == 0 {
		return "", nil
	}
	var parts []string
	var args []any
	i := 0
	for col, val := range conditions {
		i++
		parts = append(parts, fmt.Sprintf("%s = $%d", col, i))
		args = append(args, val)
	}
	return strings.Join(parts, " AND "), args
}
