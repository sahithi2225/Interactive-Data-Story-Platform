"""Data cleaning, profiling, insights, smart-chart-recommendation, predictive analytics."""
from __future__ import annotations
import io
import math
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Any, Dict, List


# ---------- IO ----------
def read_dataset(path: str | Path) -> pd.DataFrame:
    p = Path(path)
    if p.suffix.lower() in {".xls", ".xlsx"}:
        return pd.read_excel(p)
    return pd.read_csv(p)


# ---------- CLEANING ----------
def clean_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """Return cleaned df + report (nulls handled, duplicates removed, dtypes inferred)."""
    report = {"original_rows": int(len(df)), "duplicates_removed": 0, "nulls_filled": {}}
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    # drop duplicates
    before = len(df)
    df = df.drop_duplicates()
    report["duplicates_removed"] = before - len(df)

    # auto-detect datetime
    for c in df.columns:
        if df[c].dtype == object:
            try:
                converted = pd.to_datetime(df[c], errors="raise", utc=False)
                df[c] = converted
            except Exception:
                pass

    # fill nulls
    for c in df.columns:
        nulls = int(df[c].isna().sum())
        if not nulls:
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            df[c] = df[c].fillna(df[c].median())
        elif pd.api.types.is_datetime64_any_dtype(df[c]):
            df[c] = df[c].fillna(method="ffill").fillna(method="bfill")
        else:
            mode = df[c].mode(dropna=True)
            df[c] = df[c].fillna(mode.iloc[0] if not mode.empty else "Unknown")
        report["nulls_filled"][c] = nulls

    report["final_rows"] = int(len(df))
    return {"df": df, "report": report}


# ---------- COLUMN TYPES ----------
def column_types(df: pd.DataFrame) -> Dict[str, str]:
    types = {}
    for c in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[c]):
            types[c] = "datetime"
        elif pd.api.types.is_numeric_dtype(df[c]):
            types[c] = "numeric"
        elif df[c].nunique(dropna=True) <= max(20, int(len(df) * 0.05)):
            types[c] = "categorical"
        else:
            types[c] = "text"
    return types


# ---------- CHART RECOMMENDATIONS ----------
def recommend_charts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    types = column_types(df)
    num = [c for c, t in types.items() if t == "numeric"]
    cat = [c for c, t in types.items() if t == "categorical"]
    dt = [c for c, t in types.items() if t == "datetime"]
    recs: List[Dict[str, Any]] = []

    if dt and num:
        recs.append({"type": "line", "x": dt[0], "y": num[0],
                     "title": f"{num[0]} over {dt[0]}", "reason": "Time series detected"})
    if cat and num:
        recs.append({"type": "bar", "x": cat[0], "y": num[0],
                     "title": f"{num[0]} by {cat[0]}", "reason": "Categorical aggregate"})
        recs.append({"type": "pie", "x": cat[0], "y": num[0],
                     "title": f"Distribution of {num[0]} by {cat[0]}",
                     "reason": "Share-of-total view"})
    if len(num) >= 2:
        recs.append({"type": "scatter", "x": num[0], "y": num[1],
                     "title": f"{num[0]} vs {num[1]}",
                     "reason": "Correlation between two numeric variables"})
    if num:
        recs.append({"type": "histogram", "x": num[0],
                     "title": f"Distribution of {num[0]}",
                     "reason": "Numeric distribution"})
    return recs[:8]


# ---------- CHART DATA ----------
def _to_records(df: pd.DataFrame, x: str, y: str | None = None,
                agg: str = "sum", limit: int = 20) -> List[Dict[str, Any]]:
    if y is None:
        s = df[x].value_counts().head(limit)
        return [{"name": str(k), "value": int(v)} for k, v in s.items()]
    g = df.groupby(x)[y]
    s = (g.sum() if agg == "sum" else g.mean()).sort_values(ascending=False).head(limit)
    return [{"name": str(k), "value": float(v) if not math.isnan(v) else 0} for k, v in s.items()]


def build_charts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    out = []
    for rec in recommend_charts(df):
        try:
            t = rec["type"]
            if t == "line":
                d = df[[rec["x"], rec["y"]]].dropna().sort_values(rec["x"])
                d = d.groupby(rec["x"], as_index=False)[rec["y"]].mean().tail(50)
                data = [{"name": str(r[rec["x"]]), "value": float(r[rec["y"]])} for _, r in d.iterrows()]
            elif t == "bar":
                data = _to_records(df, rec["x"], rec["y"], "sum", 15)
            elif t == "pie":
                data = _to_records(df, rec["x"], rec["y"], "sum", 8)
            elif t == "scatter":
                d = df[[rec["x"], rec["y"]]].dropna().head(200)
                data = [{"x": float(r[rec["x"]]), "y": float(r[rec["y"]])} for _, r in d.iterrows()]
            elif t == "histogram":
                s = df[rec["x"]].dropna()
                counts, edges = np.histogram(s, bins=10)
                data = [{"name": f"{edges[i]:.1f}-{edges[i+1]:.1f}", "value": int(counts[i])}
                        for i in range(len(counts))]
            else:
                continue
            out.append({**rec, "data": data})
        except Exception:
            continue
    return out


# ---------- INSIGHTS ----------
def generate_insights(df: pd.DataFrame) -> Dict[str, Any]:
    types = column_types(df)
    num = [c for c, t in types.items() if t == "numeric"]
    cat = [c for c, t in types.items() if t == "categorical"]
    dt = [c for c, t in types.items() if t == "datetime"]

    insights: List[str] = []
    anomalies: List[str] = []
    recommendations: List[str] = []

    insights.append(f"Dataset contains {len(df):,} rows and {len(df.columns)} columns.")
    insights.append(f"Numeric: {len(num)}, Categorical: {len(cat)}, Datetime: {len(dt)}.")

    # trend
    if dt and num:
        d = df[[dt[0], num[0]]].dropna().sort_values(dt[0])
        if len(d) >= 4:
            half = len(d) // 2
            a, b = d[num[0]].iloc[:half].mean(), d[num[0]].iloc[half:].mean()
            change = ((b - a) / abs(a) * 100) if a else 0
            direction = "increasing" if b > a else "decreasing"
            insights.append(f"{num[0]} shows a {direction} trend of {change:+.1f}% over time.")

    # comparison
    if cat and num:
        g = df.groupby(cat[0])[num[0]].sum().sort_values(ascending=False)
        if len(g) >= 2:
            insights.append(f"Top {cat[0]} '{g.index[0]}' leads {num[0]} with "
                            f"{g.iloc[0]:,.0f} ({g.iloc[0]/g.sum()*100:.1f}% of total).")

    # anomaly via z-score
    for c in num[:3]:
        s = df[c].dropna()
        if len(s) < 5:
            continue
        z = (s - s.mean()) / (s.std() or 1)
        out = int((z.abs() > 3).sum())
        if out:
            anomalies.append(f"{out} outliers detected in '{c}' (|z| > 3).")

    # opportunity & risk
    biggest_opp = insights[2] if len(insights) > 2 else "Stable performance across the dataset."
    critical_risk = anomalies[0] if anomalies else "No critical anomalies detected."

    # recommendations
    if cat and num:
        recommendations.append(f"Double-down on the top '{cat[0]}' segment to maximize {num[0]}.")
    if dt:
        recommendations.append("Build a rolling 30-day forecast to anticipate demand shifts.")
    recommendations.append("Set automated anomaly alerts on key numeric KPIs.")
    recommendations.append("Standardize categorical labels to improve segmentation accuracy.")

    return {
        "summary": insights,
        "opportunity": biggest_opp,
        "risk": critical_risk,
        "anomalies": anomalies,
        "recommendations": recommendations,
        "drivers": [
            {"name": c, "impact": float(df[c].std() or 0)} for c in num[:4]
        ],
    }


# ---------- PREDICTIVE ----------
def predict_trend(df: pd.DataFrame) -> Dict[str, Any] | None:
    types = column_types(df)
    num = [c for c, t in types.items() if t == "numeric"]
    dt = [c for c, t in types.items() if t == "datetime"]
    if not num:
        return None
    from sklearn.linear_model import LinearRegression
    if dt:
        d = df[[dt[0], num[0]]].dropna().sort_values(dt[0])
        if len(d) < 5:
            return None
        x = np.arange(len(d)).reshape(-1, 1)
        y = d[num[0]].values
        model = LinearRegression().fit(x, y)
        future_x = np.arange(len(d), len(d) + 10).reshape(-1, 1)
        future_y = model.predict(future_x)
        history = [{"name": str(d[dt[0]].iloc[i].date() if hasattr(d[dt[0]].iloc[i], 'date') else d[dt[0]].iloc[i]),
                    "value": float(y[i]), "type": "actual"} for i in range(len(d))]
        future = [{"name": f"+{i+1}", "value": float(future_y[i]), "type": "forecast"} for i in range(10)]
        return {"target": num[0], "series": history + future}
    return None


# ---------- TOP-LEVEL ----------
def analyze(path: str | Path) -> Dict[str, Any]:
    raw = read_dataset(path)
    cleaned = clean_dataframe(raw)
    df = cleaned["df"]
    return {
        "rows": int(len(df)),
        "cols": int(len(df.columns)),
        "columns": list(df.columns),
        "types": column_types(df),
        "cleaning_report": cleaned["report"],
        "preview": df.head(20).fillna("").astype(str).to_dict(orient="records"),
        "charts": build_charts(df),
        "insights": generate_insights(df),
        "prediction": predict_trend(df),
        "recommendations": recommend_charts(df),
    }
