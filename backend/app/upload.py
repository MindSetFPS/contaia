import re
import unicodedata
from datetime import date, datetime
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select, text

from app.auth import get_current_user
from app.database import get_session
from app.models import Accountant, Expense, Payroll, Sale, Upload
from app.schemas import UploadResponse

router = APIRouter()

COLUMN_MAP = {
    "ventas": {
        "fecha": [
            "fecha",
            "date",
            "fecha de venta",
            "fecha factura",
            "fecha de factura",
        ],
        "cliente_nombre": [
            "cliente",
            "cliente_nombre",
            "nombre del cliente",
            "nombre_cliente",
        ],
        "producto": [
            "producto",
            "producto/servicio",
            "descripcion",
            "descripción",
            "concepto",
        ],
        "cantidad": ["cantidad", "cant", "qty", "quantity", "piezas"],
        "precio_unitario": [
            "precio unitario",
            "precio_unitario",
            "precio",
            "p.u.",
            "precio unit.",
            "p.u",
            "valor unitario",
        ],
        "monto_neto": ["subtotal", "monto_neto", "neto", "importe"],
        "iva": ["iva", "impuesto", "tax"],
        "monto_total": ["total", "monto_total", "importe total", "monto total"],
    },
    "gastos": {
        "fecha": ["fecha", "date", "fecha de gasto"],
        "categoria": ["categoria", "categoría", "tipo", "category", "tipo de gasto"],
        "descripcion": [
            "descripcion",
            "descripción",
            "concepto",
            "description",
            "detalle",
        ],
        "monto": ["monto", "importe", "cantidad", "amount", "total"],
        "iva": ["iva", "impuesto", "tax"],
    },
    "nomina": {
        "fecha": ["fecha", "date", "fecha de pago", "periodo"],
        "empleado": ["empleado", "nombre", "trabajador", "employee", "colaborador"],
        "puesto": ["puesto", "rol", "cargo", "position"],
        "salario_bruto": [
            "salario bruto",
            "salario_bruto",
            "bruto",
            "sueldo",
            "salario",
        ],
        "deducciones": ["deducciones", "descuentos"],
        "salario_neto": [
            "salario neto",
            "salario_neto",
            "neto",
            "sueldo neto",
            "neto a pagar",
        ],
        "isr": ["isr", "impuesto sobre la renta"],
        "imss": ["imss", "seguro social"],
    },
}

REQUIRED_COLUMNS = {
    "ventas": ["fecha", "producto", "monto_total"],
    "gastos": ["fecha", "categoria", "monto"],
    "nomina": ["fecha", "empleado", "salario_bruto", "salario_neto"],
}

TABLE_MODEL = {
    "ventas": Sale,
    "gastos": Expense,
    "nomina": Payroll,
}


def _normalize(s: str) -> str:
    s = s.lower().strip()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", s)


def _build_alias_set(table_type: str) -> set[str]:
    aliases: set[str] = set()
    for canonical, alias_list in COLUMN_MAP.get(table_type, {}).items():
        for alias in alias_list:
            aliases.add(_normalize(alias))
    return aliases


def _detect_header_row(df_raw: pd.DataFrame, table_type: str) -> tuple[int, list[str]]:
    """Find the row that best matches known column headers for the given table type."""
    known_aliases = _build_alias_set(table_type)
    best_score = -1
    best_idx = 0

    for idx in range(len(df_raw)):
        row = df_raw.iloc[idx]
        cells = [str(v).strip() for v in row if pd.notna(v)]
        if not cells:
            continue
        matched = sum(1 for c in cells if _normalize(c) in known_aliases)
        if matched > best_score:
            best_score = matched
            best_idx = idx

    if best_score < 2:
        best_idx = 0

    headers = [
        str(v).strip() if pd.notna(v) else f"Unnamed: {i}"
        for i, v in enumerate(df_raw.iloc[best_idx])
    ]
    return best_idx, headers


def _build_alias_map(table_type: str) -> dict[str, str]:
    mapping = {}
    for canonical, aliases in COLUMN_MAP.get(table_type, {}).items():
        for alias in aliases:
            mapping[_normalize(alias)] = canonical
    return mapping


def _auto_map(
    headers: list[str], table_type: str
) -> tuple[dict[str, str], list[str], list[str]]:
    alias_map = _build_alias_map(table_type)
    mapping: dict[str, str] = {}
    unmapped: list[str] = []

    for header in headers:
        h = _normalize(header)
        if h in alias_map:
            mapping[header] = alias_map[h]
        else:
            found = False
            for alias_key, canonical in alias_map.items():
                if alias_key in h or h in alias_key:
                    mapping[header] = canonical
                    found = True
                    break
            if not found:
                unmapped.append(header)

    mapped_set = set(mapping.values())
    missing = [c for c in REQUIRED_COLUMNS.get(table_type, []) if c not in mapped_set]
    return mapping, unmapped, missing


def _parse_number(val) -> float | None:
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    if not s:
        return None
    s = s.replace("$", "").replace("€", "").replace(",", "").replace(" ", "")
    try:
        return float(s)
    except ValueError:
        return None


def _parse_date(val) -> date | None:
    if isinstance(val, date):
        return val
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, pd.Timestamp):
        return val.date()
    if isinstance(val, (int, float)):
        try:
            return pd.Timestamp.fromordinal(int(val)).date()
        except Exception:
            return None
    if not val:
        return None
    s = str(val).strip()
    for fmt in (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d.%m.%Y",
        "%d %b %Y",
        "%d %B %Y",
        "%b %d, %Y",
        "%B %d, %Y",
    ):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _get_date_range(df: pd.DataFrame, date_col: str) -> tuple[date, date]:
    dates = df[date_col].dropna()
    if dates.empty:
        raise HTTPException(status_code=400, detail="No valid dates found in the data")
    return dates.min(), dates.max()


def _upsert(
    session: Session,
    model: type,
    accountant_id: int,
    client_id: int,
    records: list[dict],
    date_col: str,
    min_date: date,
    max_date: date,
):
    table_name = model.__tablename__
    session.execute(
        text(
            f"DELETE FROM {table_name} "
            f"WHERE accountant_id = :acc_id AND client_id = :cl_id "
            f"AND {date_col} BETWEEN :min_d AND :max_d"
        ),
        {
            "acc_id": accountant_id,
            "cl_id": client_id,
            "min_d": min_date,
            "max_d": max_date,
        },
    )
    for rec in records:
        instance = model(**rec)
        session.add(instance)


@router.post("/upload", response_model=UploadResponse)
def upload_file(
    file: UploadFile = File(...),
    client_id: int = Form(...),
    table_type: str = Form(...),
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if table_type not in TABLE_MODEL:
        raise HTTPException(
            status_code=400,
            detail="Tipo de tabla no válido. Debe ser: ventas, gastos, nomina",
        )

    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .xlsx")

    raw = file.file.read()
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400, detail="El archivo excede el límite de 10 MB"
        )

    try:
        df_raw = pd.read_excel(BytesIO(raw), engine="openpyxl", header=None)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Error al leer el archivo Excel: {e}"
        )

    if df_raw.empty:
        raise HTTPException(status_code=400, detail="El archivo Excel está vacío")

    header_idx, raw_headers = _detect_header_row(df_raw, table_type)
    df = df_raw.iloc[header_idx + 1 :].copy()
    df.columns = raw_headers
    df = df.reset_index(drop=True)

    mapping, unmapped_headers, missing_columns = _auto_map(raw_headers, table_type)

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No se pudieron mapear todas las columnas requeridas. "
                f"Faltan: {', '.join(missing_columns)}. "
                f"Columnas detectadas: {', '.join(raw_headers)}. "
                f"Columnas mapeadas: {', '.join(mapping.values())}."
            ),
        )

    model = TABLE_MODEL[table_type]
    date_field = "fecha"
    if date_field not in mapping.values():
        date_field = "period_date"

    date_col_name = None
    for orig, canon in mapping.items():
        if canon == date_field:
            date_col_name = orig
            break

    df[date_col_name] = df[date_col_name].apply(_parse_date)
    df = df.dropna(subset=[date_col_name])

    if df.empty:
        raise HTTPException(
            status_code=400, detail="No se encontraron fechas válidas en los datos"
        )

    min_date, max_date = _get_date_range(df, date_col_name)
    period_str = (
        f"{min_date.isoformat()} / {max_date.isoformat()}"
        if min_date != max_date
        else min_date.isoformat()
    )

    records: list[dict] = []
    skipped = 0
    for _, row in df.iterrows():
        rec: dict = {"accountant_id": user.id, "client_id": client_id}
        for orig_header, canonical in mapping.items():
            if canonical == date_field:
                val = row.get(orig_header)
                if val is not None:
                    rec[date_field] = val
                continue

            if canonical in (
                "cantidad",
                "precio_unitario",
                "monto_neto",
                "iva",
                "monto_total",
                "monto",
                "salario_bruto",
                "deducciones",
                "salario_neto",
                "isr",
                "imss",
            ):
                rec[canonical] = _parse_number(row.get(orig_header))
            else:
                val = row.get(orig_header)
                if isinstance(val, float) and pd.isna(val):
                    rec[canonical] = None
                else:
                    rec[canonical] = val

        has_null_required = False
        for req in REQUIRED_COLUMNS.get(table_type, []):
            if req != date_field and rec.get(req) is None:
                skipped += 1
                has_null_required = True
                break

        if not has_null_required:
            records.append(rec)

    _upsert(session, model, user.id, client_id, records, date_field, min_date, max_date)

    upload_record = Upload(
        accountant_id=user.id,
        client_id=client_id,
        filename=file.filename,
        table_type=table_type,
        period_date=min_date,
        rows_processed=len(records),
        rows_skipped=skipped,
    )
    session.add(upload_record)
    session.commit()

    return UploadResponse(
        processed=len(records),
        skipped=skipped,
        unused_columns=unmapped_headers,
        period=period_str,
    )


@router.get("/uploads")
def list_uploads(
    client_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    uploads = session.exec(
        select(Upload)
        .where(Upload.accountant_id == user.id, Upload.client_id == client_id)
        .order_by(Upload.created_at.desc())
    ).all()
    return uploads
