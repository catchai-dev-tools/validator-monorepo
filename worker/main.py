import os
import time
import json
import psycopg2
import requests
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from minio import Minio
from dotenv import load_dotenv
from ingest import process_fixed_width_to_csv

load_dotenv()

PGHOST = os.getenv('PGHOST', 'localhost')
PGPORT = int(os.getenv('PGPORT', '5432'))
PGDATABASE = os.getenv('PGDATABASE', 'validation_db')
PGUSER = os.getenv('PGUSER', 'postgres')
PGPASSWORD = os.getenv('PGPASSWORD', 'password')
CHANNEL = os.getenv('INGEST_CHANNEL', 'ingest_jobs')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000')

MINIO_HOST = os.getenv('MINIO_HOST', 'localhost')
MINIO_PORT = int(os.getenv('MINIO_PORT', '9000'))
MINIO_ROOT_USER = os.getenv('MINIO_ROOT_USER', 'minioadmin')
MINIO_ROOT_PASSWORD = os.getenv('MINIO_ROOT_PASSWORD', 'minioadmin')
PROCESSED_BUCKET = os.getenv('PROCESSED_BUCKET', 'processed')

minio_client = Minio(MINIO_HOST, access_key=MINIO_ROOT_USER, secret_key=MINIO_ROOT_PASSWORD, secure=False)


def ensure_bucket(bucket: str):
    found = False
    try:
        found = minio_client.bucket_exists(bucket)
    except Exception:
        found = False
    if not found:
        minio_client.make_bucket(bucket)


def set_status(bulk_file_id: str, status: str, summary: dict | None = None, reports: dict | None = None):
    url = f"{BACKEND_URL}/api/bulk-files/{bulk_file_id}/ingestion-status"
    payload = {"status": status}
    if summary is not None:
        payload["summary"] = summary
    try:
        requests.patch(url, json=payload, timeout=30)
    except Exception as e:
        print(f"[WARN] Failed to update ingestion status: {e}")


def update_bulk_file(bulk_file_id: str, clean_file_url: str, summary: dict | None = None):
    url = f"{BACKEND_URL}/api/bulk-files/{bulk_file_id}"
    payload = {"cleanFileUrl": clean_file_url}
    if summary is not None:
        payload["ingestionSummary"] = summary
    try:
        requests.put(url, json=payload, timeout=30)
    except Exception as e:
        print(f"[WARN] Failed to update bulk file: {e}")


def fetch_json(path: str):
    url = f"{BACKEND_URL}{path}" if not path.startswith("http") else path
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.json()


def download_stream(url: str):
    r = requests.get(url, stream=True, timeout=600)
    r.raise_for_status()
    for chunk in r.iter_content(chunk_size=1024 * 1024):
        if chunk:
            yield chunk


def handle_job(bulk_file_id: str):
    print(f"[JOB] Starting ingest for bulk file {bulk_file_id}")
    set_status(bulk_file_id, 'running')

    # Fetch bulk file and doc type ingestion config
    bf = fetch_json(f"/api/bulk-files/{bulk_file_id}")
    doc = fetch_json(f"/api/document-types/{bf['documentType']['id']}")
    cfg = doc.get('ingestionConfig') or {}
    if cfg.get('format') != 'fixed-width':
        raise RuntimeError('Unsupported format')
    fields = cfg.get('fields') or []

    # Stream source file
    src_url = bf['rawFileUrl']

    # Process into CSV in-memory (for very large files, a temp file would be safer)
    # We'll stream input and write to a temporary file, then upload to MinIO
    import tempfile, csv
    total_records = 0
    errors: list[str] = []

    with tempfile.NamedTemporaryFile('w+', newline='', delete=False, suffix='.csv') as tmp_csv:
        writer = csv.writer(tmp_csv)
        # header
        writer.writerow([f.get('name') or f"f{i+1}" for i, f in enumerate(fields)])
        buffer = ''
        for chunk in download_stream(src_url):
            text = chunk.decode('utf-8', errors='ignore')
            buffer += text
            while True:
                pos = buffer.find('\n')
                if pos == -1:
                    break
                line = buffer[:pos]
                buffer = buffer[pos+1:]
                if not line:
                    continue
                try:
                    row = process_fixed_width_to_csv(line, fields)
                    writer.writerow(row)
                    total_records += 1
                except Exception as e:
                    errors.append(str(e))
        # handle last partial line (no trailing newline)
        if buffer:
            try:
                row = process_fixed_width_to_csv(buffer, fields)
                writer.writerow(row)
                total_records += 1
            except Exception as e:
                errors.append(str(e))
        tmp_csv.flush()
        tmp_path = tmp_csv.name

    # Upload processed CSV to MinIO
    ensure_bucket(PROCESSED_BUCKET)
    object_name = f"{bulk_file_id}.csv"
    with open(tmp_path, 'rb') as f:
        minio_client.put_object(PROCESSED_BUCKET, object_name, f, length=-1, part_size=5*1024*1024, content_type='text/csv')
    processed_url = f"http://{MINIO_HOST}:{MINIO_PORT}/{PROCESSED_BUCKET}/{object_name}"

    # Update metadata and status
    update_bulk_file(bulk_file_id, processed_url, summary={"recordCount": total_records, "errors": errors[:5]})
    set_status(bulk_file_id, 'completed', summary={"recordCount": total_records, "errors": errors[:5]})
    print(f"[JOB] Completed {bulk_file_id}: {total_records} records -> {processed_url}")


def main():
    conn = psycopg2.connect(
        host=PGHOST, port=PGPORT, dbname=PGDATABASE, user=PGUSER, password=PGPASSWORD
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute(f"LISTEN {CHANNEL};")
    print(f"[WORKER] Listening on channel '{CHANNEL}'")

    while True:
        try:
            conn.poll()
            while conn.notifies:
                notify = conn.notifies.pop(0)
                payload = notify.payload
                bulk_file_id = payload.strip()
                try:
                    handle_job(bulk_file_id)
                except Exception as e:
                    print(f"[JOB] Failed {bulk_file_id}: {e}")
                    set_status(bulk_file_id, 'failed', summary={"errors": [str(e)]})
        except KeyboardInterrupt:
            print("Exiting...")
            break
        except Exception as e:
            print(f"[WORKER] Error in loop: {e}")
            time.sleep(1)


if __name__ == '__main__':
    main()
