import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.units import inch

def generate_pdf_report(report_path: str, result_data: dict, annotated_img_path: str):
    """
    Generate a professional laboratory PDF report using ReportLab.
    """
    doc = SimpleDocTemplate(report_path, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#2D6A4F"),
        alignment=0, # Left
        spaceAfter=12
    )

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=20
    )

    elements = []

    # --- Header ---
    elements.append(Paragraph("GrainScan AI — Quality Protocol", title_style))
    elements.append(Paragraph(f"Officially Certified Laboratory Report • {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", header_style))
    elements.append(Spacer(1, 0.2 * inch))

    # --- Summary Table ---
    data = [
        ["Attribute", "Value"],
        ["Scan ID", result_data.get("id", "N/A")],
        ["Grain Type", result_data.get("grain_type", "Unknown")],
        ["Total Grains", str(result_data.get("total_grains", 0))],
        ["Protocol Source", result_data.get("source", "Manual Upload")],
        ["Timestamp", result_data.get("timestamp", "").split("T")[0]]
    ]

    summary_table = Table(data, colWidths=[2 * inch, 3 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2D6A4F")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F5F3EE")),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#E8E4DC")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.4 * inch))

    # --- Quality Results Table ---
    elements.append(Paragraph("Quality Distribution Analysis", styles['Heading3']))
    elements.append(Spacer(1, 0.1 * inch))

    quality_data = [["Category", "Count", "Percentage"]]
    q_counts = result_data.get("quality_counts", {})
    q_pcts = result_data.get("quality_percentages", {})
    
    for category in ["Normal", "Broken", "Chalky", "Discolored"]:
        count = q_counts.get(category, 0)
        pct = q_pcts.get(category, 0)
        quality_data.append([category, str(count), f"{pct}%"])

    q_table = Table(quality_data, colWidths=[2 * inch, 1.5 * inch, 1.5 * inch])
    q_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#5C5A54")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
    ]))
    elements.append(q_table)
    elements.append(Spacer(1, 0.5 * inch))

    # --- Annotated Image ---
    if os.path.exists(annotated_img_path):
        elements.append(Paragraph("AI Visualization Overview", styles['Heading3']))
        elements.append(Spacer(1, 0.1 * inch))
        
        # Scale image to fit page
        img = Image(annotated_img_path, width=5.5 * inch, height=4.2 * inch, kind='proportional')
        elements.append(img)
        elements.append(Spacer(1, 0.5 * inch))

    # --- Signature Section ---
    elements.append(Spacer(1, 0.3 * inch))
    sig_data = [
        ["________________________", "________________________"],
        ["Laboratory Technician", "Quality Inspector (Signature)"]
    ]
    sig_table = Table(sig_data, colWidths=[3 * inch, 3 * inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
    ]))
    elements.append(sig_table)

    doc.build(elements)


def generate_batch_pdf_report(report_path: str, results_list: list):
    """
    Generate a consolidated multi-sample laboratory report.
    """
    doc = SimpleDocTemplate(report_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'BatchTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor("#2D6A4F"),
        alignment=1, # Center
        spaceAfter=20
    )

    elements = []

    # --- Header ---
    elements.append(Paragraph("GrainScan AI — Consolidated Batch Protocol", title_style))
    elements.append(Paragraph(f"Laboratory Summary Report • Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 0.3 * inch))

    # --- Consolidated Table ---
    headers = ["#", "Sample Filename", "Type", "Total", "Normal%", "Broken%", "Chalky%", "Disc%"]
    table_data = [headers]
    
    for i, res in enumerate(results_list):
        row = [
            str(i + 1),
            res.get("filename", f"Sample_{i}"),
            res.get("grain_type", "N/A"),
            str(res.get("total_grains", 0)),
            f"{res.get('quality_percentages', {}).get('Normal', 0)}%",
            f"{res.get('quality_percentages', {}).get('Broken', 0)}%",
            f"{res.get('quality_percentages', {}).get('Chalky', 0)}%",
            f"{res.get('quality_percentages', {}).get('Discolored', 0)}%",
        ]
        table_data.append(row)

    # Calculate column widths to fit A4
    col_widths = [0.3 * inch, 1.8 * inch, 0.7 * inch, 0.7 * inch, 0.8 * inch, 0.8 * inch, 0.8 * inch, 0.8 * inch]
    
    summary_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2D6A4F")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#F5F3EE")]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 0.6 * inch))

    # --- Signature Section ---
    sig_data = [
        ["Certified by:", "Validated by:"],
        ["", ""],
        ["________________________", "________________________"],
        ["Lab Technician Name", "Head of Quality Dept."]
    ]
    sig_table = Table(sig_data, colWidths=[3.5 * inch, 3.5 * inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.darkgrey),
    ]))
    elements.append(sig_table)

    doc.build(elements)
