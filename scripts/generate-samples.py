import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.pagesizes import letter

ROOT = Path(__file__).resolve().parents[1]
REPORTS = json.loads((ROOT / "src/data/reports.json").read_text(encoding="utf-8"))
OUTPUT = ROOT / "public/samples"
OUTPUT.mkdir(parents=True, exist_ok=True)
STYLES = getSampleStyleSheet()
STYLES.add(ParagraphStyle(name="WestTitle", fontName="Helvetica-Bold", fontSize=23, leading=28, textColor=colors.HexColor("#102538"), spaceAfter=12))
STYLES.add(ParagraphStyle(name="WestBody", fontName="Helvetica", fontSize=9, leading=13, textColor=colors.HexColor("#102538"), spaceAfter=6))
STYLES.add(ParagraphStyle(name="WestLabel", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=colors.HexColor("#52748D")))
STYLES.add(ParagraphStyle(name="WestNote", fontName="Helvetica", fontSize=8, leading=12, textColor=colors.HexColor("#526574"), spaceAfter=12))

def paragraph(text, style="WestBody"):
    return Paragraph(escape(text).replace("\n", "<br/>"), STYLES[style])

def footer(canvas, document):
    canvas.setStrokeColor(colors.HexColor("#C9874C"))
    canvas.line(44, 47, 568, 47)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#526574"))
    canvas.drawString(44, 34, "WESTLINE DISPATCH | FICTIONAL DEMONSTRATION | Not a client record")
    canvas.drawRightString(568, 34, f"Page {document.page}")
    canvas.setTitle(document.title)

FIELDS = [("Complaint", "complaint"), ("Status", "status"), ("Technician notes", "notes"), ("Verified repair details", "verified"), ("Pending approvals", "approvals"), ("Next action", "next"), ("Responsible party", "responsible"), ("Time records", "time"), ("Invoice review status", "invoice")]

for slug, title in [("handover", "Overnight Shift Handover"), ("service-report", "Service Report"), ("invoice-draft", "Invoice Draft")]:
    story = []
    records = REPORTS if slug == "handover" else REPORTS[:1]
    for index, record in enumerate(records):
        if index:
            story.append(PageBreak())
        story += [paragraph("WESTLINE / SAMPLE LIBRARY", "WestLabel"), Spacer(1, 14), paragraph(title, "WestTitle"),
                  paragraph("Entirely fictional commercial repair example. Not a completed Westline client job. Verified details refer only to evidence within this demonstration.", "WestNote"),
                  paragraph(f"JOB {record['id']}  /  UNIT {record['unit']}", "Heading2")]
        rows = [[paragraph(label, "WestLabel"), paragraph(record[key])] for label, key in FIELDS]
        table = Table(rows, colWidths=[115, 409], hAlign="LEFT")
        table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7), ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#F1F5F7"), colors.white])]))
        story.append(table)
        if slug == "invoice-draft":
            story += [Spacer(1, 12), paragraph("DRAFT - NOT FOR PAYMENT", "WestLabel"), Spacer(1, 7),
                      paragraph("Labor: 45 minutes x client-approved rate. Rate not supplied.\nReplacement fitting: quantity 1. Price not supplied.\nTravel, call-out fees and tax: client review required.\nNo total calculated. Client billing reviewer must confirm rates, parts, tax and authorization before issue.")]
        story += [Spacer(1, 14), paragraph("Repair acceptance and financial approval remain with the client. No roadworthiness certification, billable total or approval is implied.", "WestNote")]
    document = SimpleDocTemplate(str(OUTPUT / f"{slug}.pdf"), pagesize=letter, rightMargin=44, leftMargin=44, topMargin=40, bottomMargin=60, title=f"{title} | Fictional Westline Sample", author="Westline Dispatch")
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Generated {slug}.pdf")
