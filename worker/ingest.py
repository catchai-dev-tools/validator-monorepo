from typing import List, Dict, Any

def _convert(value: str, ftype: str) -> str:
    s = value.rstrip("\n").rstrip("\r")
    # Preserve raw spacing for str, but strip outer spaces for numeric conversions
    if ftype == 'int':
        s2 = s.strip()
        if s2 == '':
            raise ValueError('Empty integer field')
        try:
            return str(int(s2))
        except Exception as e:
            raise ValueError(f'Invalid int: {s!r}') from e
    elif ftype == 'float':
        s2 = s.strip()
        if s2 == '':
            raise ValueError('Empty float field')
        try:
            # Normalize comma decimals if present
            s2 = s2.replace(',', '.')
            return str(float(s2))
        except Exception as e:
            raise ValueError(f'Invalid float: {s!r}') from e
    else:
        # str
        return s


def process_fixed_width_to_csv(line: str, fields: List[Dict[str, Any]]) -> List[str]:
    """
    Slice a single fixed-width line into CSV cells according to fields.
    Each field dict should contain: { name, type ('str'|'int'|'float'), length }
    Returns list of stringified values ready to write with csv.writer
    """
    pos = 0
    out: List[str] = []
    total_len = len(line)
    for i, f in enumerate(fields):
        length = int(f.get('length') or 0)
        ftype = f.get('type') or 'str'
        if length <= 0:
            raise ValueError(f'Field #{i+1} has non-positive length')
        end = pos + length
        if end > total_len:
            # Pad with spaces if the line is shorter than expected
            segment = (line[pos:] + ' ' * (end - total_len))[:length]
        else:
            segment = line[pos:end]
        pos = end
        out.append(_convert(segment, ftype))
    return out
