"""Lightweight rule-based dataset Q&A (no external API needed).
Supports questions like 'top product by revenue', 'average rating', 'total units', etc."""
from __future__ import annotations
import re
import pandas as pd
from analysis import column_types

AGG_WORDS = {
    "total": "sum", "sum": "sum", "average": "mean", "avg": "mean", "mean": "mean",
    "max": "max", "maximum": "max", "min": "min", "minimum": "min", "count": "count",
}


def answer(df: pd.DataFrame, question: str) -> str:
    q = question.lower().strip()
    types = column_types(df)
    num_cols = [c for c, t in types.items() if t == "numeric"]
    cat_cols = [c for c, t in types.items() if t == "categorical"]

    def find_col(words):
        for c in df.columns:
            if c.lower() in q:
                return c
        return words[0] if words else None

    if "how many rows" in q or "row count" in q:
        return f"The dataset has {len(df):,} rows."
    if "how many columns" in q or "column count" in q:
        return f"The dataset has {len(df.columns)} columns: {', '.join(df.columns)}."

    # aggregation
    for word, fn in AGG_WORDS.items():
        if word in q:
            col = find_col(num_cols)
            if col and col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                v = getattr(df[col], fn)()
                return f"{fn.title()} of {col} = {v:,.2f}"

    # top / bottom by
    m = re.search(r"(top|bottom)\s+(\d+)?\s*([\w\s]+?)\s+by\s+([\w\s]+)", q)
    if m:
        direction, n, by_col, metric = m.group(1), int(m.group(2) or 5), m.group(3).strip(), m.group(4).strip()
        bc = next((c for c in df.columns if c.lower() == by_col), None) or (cat_cols[0] if cat_cols else None)
        mc = next((c for c in df.columns if c.lower() == metric), None) or (num_cols[0] if num_cols else None)
        if bc and mc:
            g = df.groupby(bc)[mc].sum().sort_values(ascending=(direction == "bottom")).head(n)
            return f"{direction.title()} {n} {bc} by {mc}: " + ", ".join(
                f"{k} ({v:,.0f})" for k, v in g.items())

    if "columns" in q or "schema" in q:
        return "Columns: " + ", ".join(f"{c} ({t})" for c, t in types.items())

    return ("I can answer questions like 'total revenue', 'average rating', "
            "'top 5 product by revenue', 'how many rows', 'schema'.")
