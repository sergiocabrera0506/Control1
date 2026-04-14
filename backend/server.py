from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import numpy as np
from scipy import signal
import csv
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class TransferFunctionInput(BaseModel):
    numerator: List[float]
    denominator: List[float]
    freq_min: float = 0.01
    freq_max: float = 100000.0
    num_points: int = 1024


class SaveTransferInput(BaseModel):
    name: str
    numerator: List[float]
    denominator: List[float]


def compute_analysis(num: List[float], den: List[float], freq_min: float, freq_max: float, num_points: int):
    # Remove leading zeros
    while len(num) > 1 and num[0] == 0:
        num = num[1:]
    while len(den) > 1 and den[0] == 0:
        den = den[1:]

    if all(n == 0 for n in num) or all(d == 0 for d in den):
        return None

    sys_tf = signal.TransferFunction(num, den)
    w = np.logspace(
        np.log10(max(freq_min, 1e-6) * 2 * np.pi),
        np.log10(max(freq_max, 1e-3) * 2 * np.pi),
        num_points
    )
    w_out, mag_db, phase_deg = signal.bode(sys_tf, w)

    zeros_arr, poles_arr, gain_k = signal.tf2zpk(num, den)
    is_stable = bool(np.all(poles_arr.real < 0)) if len(poles_arr) > 0 else True

    gain_margin_db = None
    phase_margin_deg = None
    gain_crossover_freq = None
    phase_crossover_freq = None
    try:
        gm, pm, wcg, wcp = signal.margin(sys_tf)
        if gm is not None and np.isfinite(gm) and gm > 0:
            gain_margin_db = float(20 * np.log10(gm))
        if pm is not None and np.isfinite(pm):
            phase_margin_deg = float(pm)
        if wcp is not None and np.isfinite(wcp) and wcp > 0:
            gain_crossover_freq = float(wcp / (2 * np.pi))
        if wcg is not None and np.isfinite(wcg) and wcg > 0:
            phase_crossover_freq = float(wcg / (2 * np.pi))
    except Exception:
        pass

    freqs_hz = (w_out / (2 * np.pi)).tolist()
    return {
        "frequencies": freqs_hz,
        "magnitude_db": [float(m) for m in mag_db],
        "phase_deg": [float(p) for p in phase_deg],
        "poles": [{"real": float(p.real), "imag": float(p.imag)} for p in poles_arr],
        "zeros": [{"real": float(z.real), "imag": float(z.imag)} for z in zeros_arr],
        "is_stable": is_stable,
        "gain_margin_db": gain_margin_db,
        "phase_margin_deg": phase_margin_deg,
        "gain_crossover_freq": gain_crossover_freq,
        "phase_crossover_freq": phase_crossover_freq,
        "order": len(den) - 1,
        "numerator": num,
        "denominator": den,
    }


@api_router.get("/")
async def root():
    return {"message": "Bode Analyzer API"}


@api_router.post("/analyze")
async def analyze(data: TransferFunctionInput):
    result = compute_analysis(
        list(data.numerator), list(data.denominator),
        data.freq_min, data.freq_max, data.num_points
    )
    if result is None:
        return {"error": "Invalid transfer function: all coefficients are zero"}
    return result


@api_router.post("/export/csv")
async def export_csv(data: TransferFunctionInput):
    result = compute_analysis(
        list(data.numerator), list(data.denominator),
        data.freq_min, data.freq_max, data.num_points
    )
    if result is None:
        return {"error": "Invalid transfer function"}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Frequency_Hz", "Magnitude_dB", "Phase_deg"])
    for i in range(len(result["frequencies"])):
        writer.writerow([
            f"{result['frequencies'][i]:.6f}",
            f"{result['magnitude_db'][i]:.4f}",
            f"{result['phase_deg'][i]:.4f}",
        ])
    csv_b64 = base64.b64encode(output.getvalue().encode()).decode()
    return {"csv_base64": csv_b64, "filename": "bode_analysis.csv"}


@api_router.post("/export/pdf")
async def export_pdf(data: TransferFunctionInput):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors as rl_colors

    result = compute_analysis(
        list(data.numerator), list(data.denominator),
        data.freq_min, data.freq_max, data.num_points
    )
    if result is None:
        return {"error": "Invalid transfer function"}

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    elems = []

    elems.append(Paragraph("Bode Analysis Report", styles['Title']))
    elems.append(Spacer(1, 12))
    elems.append(Paragraph(f"Generated: {datetime.now(timezone.utc).isoformat()}", styles['Normal']))
    elems.append(Paragraph(f"System Order: {result['order']}", styles['Normal']))
    elems.append(Paragraph(f"Numerator: {result['numerator']}", styles['Normal']))
    elems.append(Paragraph(f"Denominator: {result['denominator']}", styles['Normal']))
    elems.append(Spacer(1, 12))

    stable_text = "STABLE" if result['is_stable'] else "UNSTABLE"
    elems.append(Paragraph(f"System Stability: <b>{stable_text}</b>", styles['Heading2']))
    if result['gain_margin_db'] is not None:
        elems.append(Paragraph(f"Gain Margin: {result['gain_margin_db']:.2f} dB", styles['Normal']))
    if result['phase_margin_deg'] is not None:
        elems.append(Paragraph(f"Phase Margin: {result['phase_margin_deg']:.2f} deg", styles['Normal']))
    if result['gain_crossover_freq'] is not None:
        elems.append(Paragraph(f"Gain Crossover: {result['gain_crossover_freq']:.4f} Hz", styles['Normal']))
    elems.append(Spacer(1, 12))

    if result['poles']:
        elems.append(Paragraph("Poles", styles['Heading2']))
        pdata = [["Real", "Imaginary"]]
        for p in result['poles']:
            pdata.append([f"{p['real']:.6f}", f"{p['imag']:.6f}"])
        t = Table(pdata)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), rl_colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), rl_colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, rl_colors.black),
        ]))
        elems.append(t)
        elems.append(Spacer(1, 12))

    if result['zeros']:
        elems.append(Paragraph("Zeros", styles['Heading2']))
        zdata = [["Real", "Imaginary"]]
        for z in result['zeros']:
            zdata.append([f"{z['real']:.6f}", f"{z['imag']:.6f}"])
        t = Table(zdata)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), rl_colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), rl_colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, rl_colors.black),
        ]))
        elems.append(t)
        elems.append(Spacer(1, 12))

    elems.append(Paragraph("Bode Data (Sampled)", styles['Heading2']))
    bdata = [["Frequency (Hz)", "Magnitude (dB)", "Phase (deg)"]]
    step = max(1, len(result['frequencies']) // 40)
    for i in range(0, len(result['frequencies']), step):
        bdata.append([
            f"{result['frequencies'][i]:.4f}",
            f"{result['magnitude_db'][i]:.2f}",
            f"{result['phase_deg'][i]:.2f}",
        ])
    t = Table(bdata)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), rl_colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), rl_colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, rl_colors.black),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
    ]))
    elems.append(t)

    doc.build(elems)
    pdf_b64 = base64.b64encode(buf.getvalue()).decode()
    return {"pdf_base64": pdf_b64, "filename": "bode_report.pdf"}


@api_router.post("/time-response")
async def time_response(data: TransferFunctionInput):
    num = list(data.numerator)
    den = list(data.denominator)
    while len(num) > 1 and num[0] == 0:
        num = num[1:]
    while len(den) > 1 and den[0] == 0:
        den = den[1:]
    if all(n == 0 for n in num) or all(d == 0 for d in den):
        return {"error": "Invalid transfer function"}

    sys_tf = signal.TransferFunction(num, den)

    try:
        t_step, y_step = signal.step(sys_tf, N=data.num_points)
    except Exception:
        t_step = np.linspace(0, 10, data.num_points)
        y_step = np.zeros(data.num_points)

    try:
        t_imp, y_imp = signal.impulse(sys_tf, N=data.num_points)
    except Exception:
        t_imp = np.linspace(0, 10, data.num_points)
        y_imp = np.zeros(data.num_points)

    # Compute key metrics
    step_final = float(y_step[-1]) if len(y_step) > 0 else 0
    step_max = float(np.max(y_step)) if len(y_step) > 0 else 0
    overshoot = ((step_max - step_final) / step_final * 100) if step_final != 0 else 0

    # Rise time (10% to 90% of final value)
    rise_time = None
    if step_final != 0:
        try:
            t10 = t_step[np.where(y_step >= 0.1 * step_final)[0][0]]
            t90 = t_step[np.where(y_step >= 0.9 * step_final)[0][0]]
            rise_time = float(t90 - t10)
        except (IndexError, ValueError):
            pass

    # Settling time (2% band)
    settling_time = None
    if step_final != 0:
        try:
            band = 0.02 * abs(step_final)
            settled = np.where(np.abs(y_step - step_final) > band)[0]
            if len(settled) > 0:
                settling_time = float(t_step[settled[-1]])
        except (IndexError, ValueError):
            pass

    return {
        "step": {"time": [float(v) for v in t_step], "amplitude": [float(v) for v in y_step]},
        "impulse": {"time": [float(v) for v in t_imp], "amplitude": [float(v) for v in y_imp]},
        "metrics": {
            "steady_state": round(step_final, 4),
            "overshoot_pct": round(max(overshoot, 0), 2),
            "rise_time": round(rise_time, 4) if rise_time is not None else None,
            "settling_time": round(settling_time, 4) if settling_time is not None else None,
        }
    }


# ---- Saved Transfer Functions CRUD ----

@api_router.post("/transfers")
async def save_transfer(data: SaveTransferInput):
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "numerator": data.numerator,
        "denominator": data.denominator,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transfers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/transfers")
async def list_transfers():
    transfers = await db.transfers.find({}, {"_id": 0}).to_list(100)
    return transfers


@api_router.delete("/transfers/{transfer_id}")
async def delete_transfer(transfer_id: str):
    result = await db.transfers.delete_one({"id": transfer_id})
    if result.deleted_count == 0:
        return {"error": "Transfer not found"}
    return {"status": "deleted"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
