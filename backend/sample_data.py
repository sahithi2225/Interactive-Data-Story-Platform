"""Generates a sample sales dataset CSV for demo."""
import io, random, datetime as dt
import pandas as pd

def sample_csv_bytes() -> bytes:
    random.seed(7)
    regions = ["North", "South", "East", "West"]
    products = ["Laptop", "Phone", "Tablet", "Headphones", "Monitor"]
    rows = []
    start = dt.date(2024, 1, 1)
    for i in range(400):
        d = start + dt.timedelta(days=i % 365)
        prod = random.choice(products)
        rows.append({
            "date": d.isoformat(),
            "region": random.choice(regions),
            "product": prod,
            "units": random.randint(1, 50),
            "revenue": round(random.uniform(200, 3000), 2),
            "customer_rating": round(random.uniform(3.0, 5.0), 1),
        })
    df = pd.DataFrame(rows)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue().encode()
