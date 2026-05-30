from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak)


def build_pdf(filename: str, analysis: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm,
                            title=f"IDSP Report - {filename}")
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=colors.HexColor("#0b4f8a"))
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=colors.HexColor("#1a73e8"))
    body = styles["BodyText"]

    elements = [
        Paragraph("Interactive Data Story Platform", h1),
        Paragraph(f"Executive Report — {filename}", h2),
        Spacer(1, 0.4*cm),
        Paragraph(f"Rows: {analysis['rows']:,} &nbsp;&nbsp; Columns: {analysis['cols']}", body),
        Spacer(1, 0.5*cm),
    ]

    ins = analysis.get("insights", {})
    elements += [Paragraph("Executive Overview", h2),
                 Paragraph(f"<b>Biggest Opportunity:</b> {ins.get('opportunity','')}", body),
                 Paragraph(f"<b>Critical Risk:</b> {ins.get('risk','')}", body),
                 Spacer(1, 0.4*cm),
                 Paragraph("Key Insights", h2)]
    for s in ins.get("summary", []):
        elements.append(Paragraph(f"• {s}", body))
    elements.append(Spacer(1, 0.4*cm))

    if ins.get("anomalies"):
        elements.append(Paragraph("Anomalies", h2))
        for a in ins["anomalies"]:
            elements.append(Paragraph(f"• {a}", body))
        elements.append(Spacer(1, 0.4*cm))

    elements.append(Paragraph("Strategic Recommendations", h2))
    for r in ins.get("recommendations", []):
        elements.append(Paragraph(f"• {r}", body))

    elements.append(PageBreak())
    elements.append(Paragraph("Data Preview", h2))
    preview = analysis.get("preview", [])[:10]
    if preview:
        cols = list(preview[0].keys())[:6]
        data = [cols] + [[str(r.get(c, ""))[:20] for c in cols] for r in preview]
        t = Table(data, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a73e8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ]))
        elements.append(t)

    doc.build(elements)
    return buf.getvalue()
